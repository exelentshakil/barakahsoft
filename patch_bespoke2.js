const fs = require('fs');
const path = './src/inngest/functions/bespoke-generate.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace: const result = await generateStructureBatch(brief, dna, media, knownPaths, sitePlan, batch, provider, model);
// With:    const result = await generateStructureBatch(brief, dna, media, knownPaths, sitePlan, batch);
content = content.replace(/await generateStructureBatch\(brief, dna, media, knownPaths, sitePlan, batch, provider, model\)/g, 
'await generateStructureBatch(brief, dna, media, knownPaths, sitePlan, batch)');

// Replace: const style = await generateStylesheet(html, plan.designNotes, dna, tokens, previousCssFailures, provider, model);
// With:    const style = await generateStylesheet(html, plan.designNotes, dna, tokens, previousCssFailures);
content = content.replace(/await generateStylesheet\(html, plan\.designNotes, dna, tokens, previousCssFailures, provider, model\)/g, 
'await generateStylesheet(html, plan.designNotes, dna, tokens, previousCssFailures)');

// Replace: const raw = await callBestModel(prompt, { maxTokens: 400, temperature: 0.7, model }, provider);
// It was changed to callBestModel(prompt, { maxTokens: 400, temperature: 0.7 }) already, but let's be sure
content = content.replace(/callBestModel\(prompt, \{ maxTokens: 400, temperature: 0\.7, model \}, provider\)/g, 
'callBestModel(prompt, { maxTokens: 400, temperature: 0.7 })');

// Same for critiqueHomepage
content = content.replace(/await critiqueHomepage\(html, css, intent, provider\)/g, 
'await critiqueHomepage(html, css, intent)');

fs.writeFileSync(path, content);
