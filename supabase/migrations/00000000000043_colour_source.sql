-- Whose colours the rebuilt site uses.
--
-- Default is the reference palette, because a redesign is what is being
-- sold: rebuilding in the client's existing colours frequently does not read
-- as a redesign at all, particularly when those colours were part of why
-- their current site looks dated. One click reverts to their real brand
-- colour for owners who are attached to it.
alter table public.artifacts
  add column colour_source text not null default 'reference'
    check (colour_source in ('reference', 'client', 'hybrid'));
