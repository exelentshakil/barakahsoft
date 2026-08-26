const fs = require("fs");
let path = "src/components/admin/EditLeadDialog.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /email,\n\}: \{/g,
  `email,\n  painPoints,\n}: {`
);

content = content.replace(
  /email\?: string \| null;\n\}\) \{/g,
  `email?: string | null;\n  painPoints?: string[];\n}) {`
);

content = content.replace(
  /const \[emailValue, setEmailValue\] = useState\(email \?\? ""\);/,
  `const [emailValue, setEmailValue] = useState(email ?? "");\n  const [painPointsValue, setPainPointsValue] = useState(painPoints?.join("\\n") ?? "");`
);

content = content.replace(
  /email: emailValue,\n\s*\}\),/,
  `email: emailValue,\n          pain_points: painPointsValue.split("\\n").map((p) => p.trim()).filter(Boolean),\n        }),`
);

const newTextarea = `
          <div>
            <Label htmlFor="edit-pain-points">Target Intake Pains (One per line)</Label>
            <textarea
              id="edit-pain-points"
              value={painPointsValue}
              onChange={(e) => setPainPointsValue(e.target.value)}
              rows={4}
              className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="e.g. Outdated design\\nNot enough leads"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              These pains are fed to the AI to customize the generated copy and audit sections.
            </p>
          </div>
`;

content = content.replace(
  /\{notes\.length > 0 && \(/,
  newTextarea + "\n          {notes.length > 0 && ("
);

fs.writeFileSync(path, content, "utf8");
console.log("Updated EditLeadDialog with pain points editing capability");
