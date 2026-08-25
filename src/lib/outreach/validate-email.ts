import { promises as dns } from "dns";

// Is this address worth spending a cold send on?
//
// Sending to an address that cannot receive mail costs more than the wasted
// send: bounces are what move a sending domain from "delivered" to "spam
// folder" for every other prospect. Brevo will report the bounce afterwards;
// checking first is cheaper than earning it back.
//
// Three checks, in increasing cost: shape, then whether the domain accepts
// mail at all, then whether it looks like a real business inbox. Only the
// first two can fail an address — the third is advice, because plenty of
// small businesses genuinely use a gmail.com address and refusing those
// would rule out much of the market this sells to.

export interface EmailVerdict {
  ok: boolean;
  /** Why it cannot be used. Null when ok. */
  problem: string | null;
  /** Worth showing the operator, but not disqualifying. */
  notes: string[];
}

// Deliberately not the RFC grammar, which permits addresses no business
// uses and that no provider would accept anyway.
const SHAPE = /^[^\s@,;:<>()[\]\\"]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

const ROLE_PREFIX = /^(info|contact|admin|office|hello|support|sales|enquiries|inquiries|team|mail|no-?reply)@/i;
const FREE_MAILBOX = /@(gmail|yahoo|hotmail|outlook|aol|icloud|live|msn|proton(mail)?|gmx|mail)\./i;

export async function validateOutreachEmail(rawEmail: string, siteUrl?: string | null): Promise<EmailVerdict> {
  const email = rawEmail.trim().toLowerCase();
  const notes: string[] = [];

  if (!email) return { ok: false, problem: "No address given.", notes };
  if (email.length > 254) return { ok: false, problem: "Address is too long to be real.", notes };
  if (!SHAPE.test(email)) return { ok: false, problem: "That is not a valid email address.", notes };

  const domain = email.split("@")[1];

  // The decisive check. A domain with no MX (and no A record to fall back
  // on) cannot receive mail, so this address will always bounce.
  try {
    const mx = await dns.resolveMx(domain);
    if (!mx || mx.length === 0) throw new Error("no mx");
  } catch {
    try {
      // Some small domains accept mail on the A record instead.
      await dns.resolve4(domain);
      notes.push("No MX record — mail may still be accepted on the A record, but delivery is less certain.");
    } catch {
      return { ok: false, problem: `${domain} cannot receive email — this address will bounce.`, notes };
    }
  }

  if (ROLE_PREFIX.test(email)) {
    notes.push("A shared inbox (info@, contact@). It reaches the business but often not the owner.");
  }

  if (FREE_MAILBOX.test(email)) {
    notes.push("A free mailbox rather than the business domain. Common for small trades — usually still the owner.");
  } else if (siteUrl) {
    // An address on the same domain as the website is the strongest signal
    // that it belongs to this business and not a directory listing.
    try {
      const host = new URL(/^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`).hostname.replace(/^www\./, "");
      if (host && domain !== host && !domain.endsWith(`.${host}`) && !host.endsWith(`.${domain}`)) {
        notes.push(`Domain does not match the website (${host}) — check it belongs to this business.`);
      }
    } catch {
      // A malformed site URL is not a reason to reject the address.
    }
  }

  return { ok: true, problem: null, notes };
}
