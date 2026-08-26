const fs = require("fs");
let path = "src/app/api/leads/add-url/route.ts";

require("child_process").execSync("git checkout src/app/api/leads/add-url/route.ts");
let content = fs.readFileSync(path, "utf8");

content = content.replace(/source: "outreach",/g, `source: "outreach",
            pain_points: [
              "Outdated design / looks wrong on phones",
              "Not enough leads or enquiries",
              "Nobody finds us on Google",
              "Invisible in AI search",
              "Visitors don't convert into calls"
            ],`);

fs.writeFileSync(path, content, "utf8");
console.log("Injected pain points into add-url API");
