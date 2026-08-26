const fs = require("fs");
let path = "src/components/admin/AddUrlDialog.tsx";
let content = fs.readFileSync(path, "utf8");

// 1. Add state variable
content = content.replace(
  /const \[emailNotes, setEmailNotes\] = useState<string\[\]>\(\[\]\);/,
  `const [emailNotes, setEmailNotes] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState("Outdated design / looks wrong on phones\\nNot enough leads or enquiries\\nNobody finds us on Google\\nInvisible in AI search\\nVisitors don't convert into calls");`
);

// 2. Add to fetch body
content = content.replace(
  /email: email\.trim\(\) \|\| undefined,/g,
  `email: email.trim() || undefined,
          pain_points: painPoints.split("\\n").map(p => p.trim()).filter(Boolean),`
);

// 3. Add to UI
const newTextarea = `            <div className="space-y-1.5">
              <Label htmlFor="add-pain-points" className="text-xs font-bold text-[#0d1738]">
                Target Intake Pains (One per line)
              </Label>
              <textarea
                id="add-pain-points"
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y text-xs font-mono"
              />
            </div>
`;

content = content.replace(
  /\{emailNotes\.length > 0 && \(/,
  newTextarea + "\n            {emailNotes.length > 0 && ("
);

// 4. Reset state on success
content = content.replace(
  /setEmail\(""\);/,
  `setEmail("");
      setPainPoints("Outdated design / looks wrong on phones\\nNot enough leads or enquiries\\nNobody finds us on Google\\nInvisible in AI search\\nVisitors don't convert into calls");`
);

fs.writeFileSync(path, content, "utf8");
console.log("Updated AddUrlDialog with pain points editor");
