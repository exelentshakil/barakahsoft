const fs = require('fs');
const path = './src/inngest/functions/bespoke-generate.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. We remove provider and model from the event data destructuring and set them as consts.
const eventDestructureTarget = `const { lead_id, overrides, phase, provider, model } = event.data as {
      lead_id: string;
      overrides: BriefOverrides;
      phase: 1 | 2;
      provider?: GenerationProvider;
      model?: string;
    };`;

const newEventDestructure = `const { lead_id, overrides, phase } = event.data as {
      lead_id: string;
      overrides: BriefOverrides;
      phase: 1 | 2;
    };
    const provider = "openai";
    const model = undefined;`;

content = content.replace(eventDestructureTarget, newEventDestructure);

fs.writeFileSync(path, content);
