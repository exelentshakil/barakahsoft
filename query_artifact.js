const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Let's find saddle roofing specifically
  const { data: leads } = await supabase.from('leads').select('id, business_name').ilike('business_name', '%saddle%');
  
  if (!leads || leads.length === 0) {
    console.log("Saddle roofing not found in local db, checking latest artifact instead.");
  }
  
  const leadId = leads && leads.length > 0 ? leads[0].id : null;
  
  let query = supabase.from('artifacts').select('bespoke_homepage_html, bespoke_css');
  if (leadId) {
    query = query.eq('lead_id', leadId);
  } else {
    query = query.order('created_at', { ascending: false }).limit(1);
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error(error);
    return;
  }
  
  if (data && data.length > 0) {
    const css = data[0].bespoke_css;
    console.log("CSS LENGTH:", css?.length);
    console.log("MATCHES CLAMP:", (css || "").match(/clamp/g)?.length || 0);
    console.log("MATCHES NEGATIVE MARGIN:", (css || "").match(/margin-top:\s*-[0-9]/g)?.length || 0);
    console.log("MATCHES RADIAL:", (css || "").match(/radial-gradient/g)?.length || 0);
    console.log("MATCHES CLIP-PATH:", (css || "").match(/clip-path/g)?.length || 0);
    console.log("MATCHES BEFORE/AFTER:", (css || "").match(/::(before|after)/g)?.length || 0);
    
    // Print a snippet of the CSS to see how it cooked
    console.log("\n--- CSS SNIPPET ---");
    // Just find the h1 and some hero rules
    const lines = css?.split('\n') || [];
    const h1Index = lines.findIndex(l => l.includes('h1'));
    if (h1Index > -1) {
       console.log(lines.slice(Math.max(0, h1Index - 5), h1Index + 10).join('\n'));
    }
    
    const heroIndex = lines.findIndex(l => l.includes('#hero') || l.includes('.hero'));
    if (heroIndex > -1) {
       console.log('\n--- HERO RULES ---');
       console.log(lines.slice(Math.max(0, heroIndex - 2), heroIndex + 15).join('\n'));
    }
  }
}

run();
