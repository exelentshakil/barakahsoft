create table public.close_plan_steps (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  step_number int not null,
  kind text not null check (kind in ('email','call','sms')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending','sent','skipped','done')),
  script_or_template text,
  created_at timestamptz not null default now()
);

create index close_plan_steps_lead_idx on public.close_plan_steps (lead_id);

alter table public.close_plan_steps enable row level security;
