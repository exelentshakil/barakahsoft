const fs = require("fs");
let path = "src/app/api/leads/add-url/route.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /pain_points: \[\n              "Outdated design \/ looks wrong on phones",\n              "Not enough leads or enquiries",\n              "Nobody finds us on Google",\n              "Invisible in AI search",\n              "Visitors don't convert into calls"\n            \],/g,
  `pain_points: Array.isArray(body.pain_points) && body.pain_points.length > 0 ? body.pain_points : [
              "Outdated design / looks wrong on phones",
              "Not enough leads or enquiries",
              "Nobody finds us on Google",
              "Invisible in AI search",
              "Visitors don't convert into calls"
            ],`
);

fs.writeFileSync(path, content, "utf8");
console.log("Updated add-url route to respect custom pain points");
