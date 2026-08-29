const fs = require('fs');
const path = './src/app/api/leads/[id]/generate/route.ts';
let content = fs.readFileSync(path, 'utf8');

// The line is: const body = (await req.json().catch(() => ({}))) as BriefOverrides & { phase?: 1 | 2; provider?: string; model?: string };
content = content.replace(/BriefOverrides & \{ phase\?: 1 \| 2; provider\?: string; model\?: string \}/g, 'BriefOverrides & { phase?: 1 | 2 }');

// Remove provider and model extraction
content = content.replace(/const provider = body\.provider === "gemini" \? "gemini" : "openai";\n/g, '');
content = content.replace(/\/\/ An operator's explicit model choice.*\n.*\n.*\nconst model = typeof body\.model === "string".*\n/g, '');

// Remove the gemini key check
content = content.replace(/if \(provider === "gemini" && !process\.env\.GEMINI_API_KEY\) \{[\s\S]*?\}\n\n/g, '');

// Remove provider and model from inngest.send
content = content.replace(/data: \{ lead_id: leadId, overrides, phase, provider, model \}/g, 'data: { lead_id: leadId, overrides, phase }');

// Remove provider from NextResponse.json
content = content.replace(/phase,\n\s*provider,\n\s*warnings/g, 'phase,\n    warnings');

fs.writeFileSync(path, content);
