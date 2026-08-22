-- Real competitors, measured.
--
-- Replaces a hardcoded table of "Top Competitor A/B/C" with invented speed
-- scores that shipped identically to every client regardless of trade or
-- city. Competitors come from a real search; review counts come from Places
-- and speed from a real PageSpeed run. A figure that could not be measured
-- stays null, because a blank cell is honest and an invented one is the
-- thing being removed.
alter table public.scrape_results
  add column competitors jsonb;
