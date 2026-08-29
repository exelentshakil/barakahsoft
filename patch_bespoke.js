const fs = require('fs');
const path = './src/inngest/functions/bespoke-generate.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove provider and model from event data destructuring
content = content.replace(/const \{ lead_id, overrides, phase, provider, model \} = event\.data as \{([^}]+)\};/g, 
`const { lead_id, overrides, phase } = event.data as {
      lead_id: string;
      overrides: BriefOverrides;
      phase: 1 | 2;
    };`);

// 2. Remove provider from callBestModel calls inside pad-brief-lists
// Actually it will be callSmartModel now or callFastModel.
// The user padding was using callBestModel with `model` and `provider`. 
// I'll replace `callBestModel(prompt, { maxTokens: 400, temperature: 0.7, model }, provider)` 
// with `callSmartModel(prompt, { maxTokens: 400, temperature: 0.7 })`
content = content.replace(/callBestModel\(prompt, \{ maxTokens: 400, temperature: 0\.7, model \}, provider\)/g, 
`callBestModel(prompt, { maxTokens: 400, temperature: 0.7 })`);

// Remove provider from imports (if we don't need it)
// content = content.replace(/import \{ callBestModel, type GenerationProvider \}/g, 'import { callBestModel }');

fs.writeFileSync(path, content);
