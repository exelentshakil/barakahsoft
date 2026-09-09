import { createClient } from "@supabase/supabase-js";

// Give someone access to a brand's dashboard.
//
// Onboarding an operator is three things that have to agree: an auth user with
// a password they can actually sign in with, a confirmed email (Supabase
// refuses password sign-in on an unconfirmed address), and an accounts row for
// the brand whose dashboard they need. Doing them by hand in the dashboard is
// where the third gets forgotten, and the symptom is a successful login that
// bounces straight back to /login with "not authorised".
//
// One person may hold accounts for several brands — accounts is unique on
// (email, tenant_slug), not on email — so running this twice with different
// tenants is the supported way to give yourself both dashboards.
//
//   npm run operator -- --email you@example.com --tenant smilecreative --password 'a-strong-one'
//   npm run operator -- --email you@example.com --tenant barakahsoft
//   npm run operator -- --list
//
// Passwords are set through the Admin API rather than by writing a hash into
// auth.users, so Supabase owns the hashing scheme and can change it.

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Pull them first:  vercel env pull .env.local"
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function list() {
  const { data, error } = await admin
    .from("accounts")
    .select("email, tenant_slug, role")
    .order("email");
  if (error) throw new Error(error.message);

  if (!data?.length) return console.log("No operators yet.");
  console.log("\nemail                                tenant          role");
  console.log("─".repeat(66));
  for (const row of data) {
    console.log(`${row.email.padEnd(36)} ${String(row.tenant_slug).padEnd(15)} ${row.role}`);
  }
  console.log();
}

async function upsertOperator(email: string, tenant: string, password?: string) {
  // Supabase has no "get user by email" on the admin client, so the page is
  // scanned. Fine at this scale; revisit past a few hundred users.
  const { data: page, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw new Error(listError.message);
  const existing = page.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    if (password) {
      // email_confirm matters as much as the password: Supabase refuses
      // password sign-in on an unconfirmed address, and the failure reads as
      // "invalid credentials", which sends you looking at the wrong thing.
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      });
      if (error) throw new Error(`updating ${email}: ${error.message}`);
      console.log(`  auth user updated (password set, email confirmed)`);
    } else {
      console.log(`  auth user exists, password unchanged`);
    }
  } else {
    if (!password) throw new Error(`${email} has no auth user yet — pass --password to create one.`);
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`creating ${email}: ${error.message}`);
    console.log(`  auth user created`);
  }

  const { data: already } = await admin
    .from("accounts")
    .select("id")
    .eq("email", email)
    .eq("tenant_slug", tenant)
    .maybeSingle();

  if (already) {
    console.log(`  accounts row already exists for ${tenant}`);
    return;
  }

  const { error } = await admin
    .from("accounts")
    .insert({ email, tenant_slug: tenant, role: "operator" });
  if (error) throw new Error(`granting ${tenant}: ${error.message}`);
  console.log(`  accounts row created for ${tenant}`);
}

async function main() {
  if (process.argv.includes("--list")) return list();

  const email = arg("email");
  const tenant = arg("tenant");
  const password = arg("password");

  if (!email || !tenant) {
    console.error(
      "Usage:\n" +
        "  npm run operator -- --email <email> --tenant <slug> [--password <password>]\n" +
        "  npm run operator -- --list\n"
    );
    process.exit(1);
  }

  console.log(`\n${email} → ${tenant}`);
  await upsertOperator(email, tenant, password);
  console.log(`\nSign in at the tenant's own host. An account for one brand does not\n` +
    `admit you to another — middleware checks the row for the host you are on.\n`);
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
