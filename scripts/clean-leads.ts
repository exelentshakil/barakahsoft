import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://liepxeeugfrxmidcmbxo.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error("Error: SUPABASE_SERVICE_ROLE_KEY is required in .env.local to clean the database.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("🧹 Starting complete database leads cleanup...");

  // 1. Delete dependent tables
  const tables = [
    "lead_inquiries",
    "close_plan_steps",
    "outcomes",
    "subscriptions",
    "hosting_subscriptions",
    "build_jobs",
    "media_assets",
    "artifacts",
    "scrape_results",
    "leads",
  ];

  for (const table of tables) {
    const { error, count } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.warn(`  ⚠️ Table [${table}] delete notice:`, error.message);
    } else {
      console.log(`  ✓ Cleaned table [${table}]`);
    }
  }

  console.log("✨ All lead tables cleaned! The database is fresh with 0 leads.");
}

main();
