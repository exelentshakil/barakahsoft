// Turning a model's reply into an object, given that it is prose until proven
// otherwise. The truncation cases are the ones that matter: a response cut off
// at the token limit used to be discarded whole, which is what "the design
// brief could not be written" looked like from the outside.

import { parseJsonResponse } from "../src/lib/parse-json-response";
let f=0; const ok=(c:boolean,m:string)=>{console.log((c?"  ok   ":"  FAIL ")+m); if(!c)f++;};

ok(parseJsonResponse('{"a":1}')?.a === 1, "plain object");
ok(parseJsonResponse('```json\n{"a":1}\n```')?.a === 1, "fenced");
ok(parseJsonResponse('Sure! {"a":1} Hope this helps! }')?.a === 1, "trailing prose with a stray brace");
ok(parseJsonResponse('{"a":"He said \\"hi\\" }","b":2}')?.b === 2, "braces and quotes inside a string");
ok(parseJsonResponse('{"a":[1,2],"b":{"c":3}}') !== null, "nested");

// The case that was silently discarding whole briefs.
const truncated = '{"idea":"Nobody watches","sections":[{"id":"hero","kind":"hero"},{"id":"tiers","kind":"membership-tie';
const rec = parseJsonResponse(truncated) as any;
ok(rec !== null, "a truncated response is recovered rather than discarded");
ok(rec?.idea === "Nobody watches", "…with its complete fields intact");
ok(Array.isArray(rec?.sections) && rec.sections.length === 1, `…keeping only COMPLETE array items (${rec?.sections?.length})`);
ok(rec?.sections?.[0]?.kind === 'hero', 'the partial item is dropped, not patched into something that reads as real');
const flat = parseJsonResponse('{"idea":"Nobody watches","editorialDevice":"oversized numer') as any;
ok(flat?.idea === 'Nobody watches' && flat?.editorialDevice === undefined, 'a flat object truncated mid-value keeps the complete field and drops the partial one');

ok(parseJsonResponse("no json here at all") === null, "prose with no object returns null");
ok(parseJsonResponse("") === null, "empty returns null");
console.log(f?`\n${f} failed`:"\nparse-json holds");
process.exit(f?1:0);
