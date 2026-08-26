const fs = require("fs");
let path = "src/app/api/leads/add-url/route.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /if \(verdict\.ok\) \{\s*validEmail = rawEmail\.toLowerCase\(\);\s*\} else \{\s*\/\/ If strict validation fails on bulk, record note but still allow or log\s*validEmail = rawEmail\.toLowerCase\(\);\s*\}/,
  `if (verdict.ok) {
          validEmail = rawEmail.toLowerCase();
        } else {
          // If strict validation fails on bulk, we DROP the invalid email entirely.
          // This forces the admin to see "No email on file" in the UI so they know they need to hunt down a real one.
          validEmail = null;
        }`
);

fs.writeFileSync(path, content, "utf8");
console.log("Updated bulk logic to drop invalid emails entirely");
