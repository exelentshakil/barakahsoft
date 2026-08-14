create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  template_shell_id uuid not null references public.template_shells(id),
  extracted_assets jsonb not null default '{}',
  -- Ordered array of {slug, kind, h2, body_content, media_asset_ids, cta}.
  -- Single source of truth SectionRenderer consumes both pre- and
  -- post-payment — see plan §6 for the slug->route unlock mechanism.
  funnel_pages jsonb not null default '[]',
  inner_pages_built boolean not null default false,
  screenshot_url text,
  qa_status text not null default 'pending' check (qa_status in ('pending','approved','rejected')),
  qa_notes text,
  last_edited_at timestamptz,
  last_edited_by uuid references public.accounts(id),
  created_at timestamptz not null default now()
);

alter table public.artifacts enable row level security;
