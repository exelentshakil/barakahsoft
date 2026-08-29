const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: leads } = await supabase.from('leads').select('id').ilike('business_name', '%saddle%');
  const leadId = leads && leads.length > 0 ? leads[0].id : null;
  const { data } = await supabase.from('artifacts').select('bespoke_css').eq('lead_id', leadId);
  const css = data[0].bespoke_css;
  
  const lines = css?.split('\n') || [];
  
  console.log("\n--- SHAPING (clip-path) ---");
  lines.forEach((l, i) => { if (l.includes('clip-path')) console.log(lines.slice(i-2, i+4).join('\n')); });

  console.log("\n--- NEGATIVE MARGIN OVERLAP ---");
  lines.forEach((l, i) => { if (l.includes('margin-top: -')) console.log(lines.slice(i-2, i+4).join('\n')); });
  
  console.log("\n--- RADIAL GRADIENT ---");
  lines.forEach((l, i) => { if (l.includes('radial-gradient')) console.log(lines.slice(i-2, i+4).join('\n')); });
  
  console.log("\n--- EDITORIAL MEDIA (::before offset) ---");
  let beforeIdx = -1;
  lines.forEach((l, i) => { if (l.includes('::before') && l.includes('about')) beforeIdx = i; });
  if (beforeIdx > -1) console.log(lines.slice(beforeIdx-2, beforeIdx+12).join('\n'));
}

run();
