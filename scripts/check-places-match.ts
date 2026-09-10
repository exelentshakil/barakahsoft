/**
 * The Google Places match policy, exercised directly.
 *
 * The cost of getting this wrong is asymmetric and was once paid in
 * production: a stranger's 4.9 rating, review count, town and five of their
 * customers' testimonials shipped onto a client's homepage. Loosening the
 * policy to raise the match rate is exactly the kind of change that could pay
 * it again, so the incident is pinned here as a case that must keep failing.
 *
 * No API key and no network: the policy is a pure function.
 */
import { matchesLead } from "@/lib/google/places";

type Place = Parameters<typeof matchesLead>[0];
type Expect = Parameters<typeof matchesLead>[1];

const cases: Array<{ label: string; place: Place; expect: Expect; want: boolean }> = [
  {
    label: "the incident: Saddle Roofing (WY) must never match Expert Roofing Services (FL)",
    place: { name: "Expert Roofing Services", website: "https://expertroofingfl.com", formatted_phone_number: "(772) 555-0199", formatted_address: "Stuart, FL, USA" },
    expect: { domain: "saddleroofing.com", phone: "307-555-0100", name: "Saddle Roofing" },
    want: false,
  },
  {
    label: "same trade name in another state, contradicted by phone and website",
    place: { name: "Saddle Roofing", website: "https://saddleroofing-fl.com", formatted_phone_number: "(772) 555-9999", formatted_address: "Stuart, FL" },
    expect: { domain: "saddleroofing.com", phone: "307-555-0100", name: "Saddle Roofing" },
    want: false,
  },
  {
    label: "a name of only generic trade words proves nothing",
    place: { name: "Roofing Services Company", website: "https://other.com" },
    expect: { domain: "mine.com", phone: null, name: "Roofing Services" },
    want: false,
  },
  {
    label: "the listing is in a different town than the lead",
    place: { name: "Bramble Joinery", website: "https://bramble.example", formatted_address: "Bristol, UK" },
    expect: { domain: "bramblejoinery.co.uk", phone: null, name: "Bramble Joinery", town: "Leeds" },
    want: false,
  },
  {
    label: "the domain is decisive",
    place: { name: "Trading As Something Else", website: "https://saddleroofing.com" },
    expect: { domain: "www.saddleroofing.com", phone: null, name: "Saddle Roofing" },
    want: true,
  },
  {
    label: "the phone is decisive even when the websites differ",
    place: { name: "Saddle Roofing LLC", website: "https://facebook.com/saddle", formatted_phone_number: "(307) 555-0100" },
    expect: { domain: "saddleroofing.com", phone: "3075550100", name: "Saddle Roofing" },
    want: true,
  },
  {
    label: "a listing pointing at Facebook is the ordinary case, not a different company",
    place: { name: "Saddle Roofing", website: "https://facebook.com/saddleroofing", formatted_address: "Cheyenne, WY" },
    expect: { domain: "saddleroofing.com", phone: null, name: "Saddle Roofing" },
    want: true,
  },
  {
    label: "a .co.uk listing against the .com we crawled",
    place: { name: "Bramble Joinery", website: "https://bramblejoinery.co.uk", formatted_address: "Leeds, UK" },
    expect: { domain: "bramblejoinery.com", phone: null, name: "Bramble Joinery" },
    want: true,
  },
];

let failed = 0;
for (const { label, place, expect, want } of cases) {
  const got = matchesLead(place, expect);
  if (got.ok !== want) {
    failed++;
    console.error(`places-match: FAIL — ${label}\n  expected ok=${want}, got ok=${got.ok} (${got.why})`);
  }
}

if (failed > 0) {
  console.error(`places-match: ${failed} of ${cases.length} cases failed`);
  process.exit(1);
}
console.log(`places-match: ok (${cases.length} cases)`);
