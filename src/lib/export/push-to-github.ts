import type { SiteFile } from "@/lib/export/build-site-zip";

// Handing the site over as a repository rather than a folder.
//
// A zip asks the client to be technical: unzip it, make a repo, push it,
// then connect a host. That is the step where a roofer stops and asks what
// a terminal is, which turns "you own your site" from a reassurance into an
// obstacle. Pushing the repo ourselves keeps the ownership and removes the
// work — they connect Vercel to a repo that already exists, or point their
// own host at it, or move it to AWS later, and none of that involves us.
//
// Written against the Git Data API rather than the Contents API on purpose:
// Contents writes one commit per file, so a twenty-five file site lands as
// twenty-five commits and a half-pushed repo if anything fails midway. This
// builds one tree and one commit, so the repository either has the whole
// site or was never touched.

const API = "https://api.github.com";

interface GitHubOptions {
  /** Repository name. Must be unused on the account. */
  repo: string;
  description: string;
  /** Public repositories are readable by anyone — default is private. */
  isPrivate?: boolean;
}

export interface GitHubPushResult {
  repoUrl: string;
  owner: string;
  repo: string;
  commitSha: string;
}

class GitHubError extends Error {}

async function gh<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // The messages GitHub returns here are the ones an operator can act on
    // — name already exists, token lacks a scope — so they are surfaced
    // rather than replaced with something generic.
    let detail = body.slice(0, 300);
    try {
      const parsed = JSON.parse(body);
      detail = parsed.message ?? detail;
      if (Array.isArray(parsed.errors) && parsed.errors[0]?.message) detail = parsed.errors[0].message;
    } catch {
      // Non-JSON body; the raw text is the best available detail.
    }
    throw new GitHubError(`GitHub ${res.status}: ${detail}`);
  }

  return res.json() as Promise<T>;
}

export async function pushSiteToGitHub(files: SiteFile[], options: GitHubOptions): Promise<GitHubPushResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new GitHubError(
      "GITHUB_TOKEN is not set on this deployment. Add a token with repo-creation access before pushing."
    );
  }

  const user = await gh<{ login: string }>(token, "/user");
  const owner = user.login;

  // auto_init gives the repository a first commit, which means there is a
  // ref to build the real commit on top of. Creating an empty repo instead
  // leaves no parent and the Git Data API has nothing to attach to.
  const created = await gh<{ name: string; html_url: string; default_branch: string }>(token, "/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name: options.repo,
      description: options.description,
      private: options.isPrivate ?? true,
      auto_init: true,
    }),
  });

  const repo = created.name;
  const branch = created.default_branch || "main";

  // GitHub takes a moment to make the initial commit readable after
  // auto_init, so the first ref read is retried rather than failing a push
  // that would have worked a second later.
  let baseSha = "";
  for (let attempt = 0; attempt < 5 && !baseSha; attempt++) {
    try {
      const ref = await gh<{ object: { sha: string } }>(token, `/repos/${owner}/${repo}/git/ref/heads/${branch}`);
      baseSha = ref.object.sha;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
  if (!baseSha) throw new GitHubError("The repository was created but its first commit never appeared.");

  const baseCommit = await gh<{ tree: { sha: string } }>(token, `/repos/${owner}/${repo}/git/commits/${baseSha}`);

  // Blobs are uploaded base64 so a file containing anything other than
  // plain ASCII survives the round trip intact.
  const blobs = await Promise.all(
    files.map(async (file) => {
      const blob = await gh<{ sha: string }>(token, `/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({
          content: Buffer.from(file.content, "utf8").toString("base64"),
          encoding: "base64",
        }),
      });
      return { path: file.path, mode: "100644" as const, type: "blob" as const, sha: blob.sha };
    })
  );

  const tree = await gh<{ sha: string }>(token, `/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: blobs }),
  });

  const commit = await gh<{ sha: string }>(token, `/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: `${options.description}\n\nThe complete site, ready to deploy. See README.md.`,
      tree: tree.sha,
      parents: [baseSha],
    }),
  });

  await gh(token, `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  return { repoUrl: created.html_url, owner, repo, commitSha: commit.sha };
}
