-- Lets a logged-in user read (only) their own accounts row, so app code
-- (middleware) can check admin membership with the session-bound client
-- instead of needing the service-role key at the edge.
create policy "accounts_self_read" on public.accounts
  for select
  to authenticated
  using (email = (auth.jwt() ->> 'email'));
