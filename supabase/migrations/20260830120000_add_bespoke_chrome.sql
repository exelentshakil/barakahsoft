-- The generated navigation and footer, stored separately from the homepage
-- body so every route under /s/[leadSlug] renders the same bespoke chrome.
-- Before this, the nav was written inside the homepage hero and the footer was
-- concatenated into the homepage markup, so both existed on the homepage only
-- and every inner page fell back to the shared React components — a different
-- design from the page they framed.
alter table public.artifacts
  add column if not exists bespoke_chrome_html text,
  add column if not exists bespoke_footer_html text;
