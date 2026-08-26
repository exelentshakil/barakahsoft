const fs = require('fs');
const file = 'src/components/admin/AdminLeadWorkspace.tsx';
let code = fs.readFileSync(file, 'utf8');

// Ensure import exists
if (!code.includes('resolveBusinessContact')) {
  code = code.replace(
    /import \{ displayPhone \} from "@\/lib\/phone";/,
    'import { displayPhone } from "@/lib/phone";\nimport { resolveBusinessContact } from "@/lib/business-contact";'
  );
}

// Replace raw phone/email logic
code = code.replace(
  /const nap = \(facts\.nap as \{ address\?: string; phone\?: string; phones\?: string\[\]; email\?: string; emails\?: string\[\] \} \| undefined\) \|\| \{\};\n\s*const rawPhone = nap\.phones\?\.find\(\(p\) => \/\\d\{7,\}\/\.test\(p\.replace\(\/\\D\/g, ""\)\)\) \|\| nap\.phone \|\| lead\.phone;\n\s*const phone = displayPhone\(rawPhone\) \|\| "No phone on file";\n\s*const email = nap\.emails\?\.\[0\] \|\| nap\.email \|\| lead\.email \|\| "No email on file";/,
  `const contact = resolveBusinessContact(scrapeResults, { phone: lead.phone, email: lead.email });\n  const phone = displayPhone(contact.phone) || "No phone on file";\n  const email = contact.email || "No email on file";`
);

fs.writeFileSync(file, code);
