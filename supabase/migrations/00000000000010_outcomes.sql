create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  result text not null check (result in ('won','lost','no_response','nurturing')),
  notes text,
  recorded_at timestamptz not null default now()
);

alter table public.outcomes enable row level security;
