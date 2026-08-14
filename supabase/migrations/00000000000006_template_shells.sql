create table public.template_shells (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  industry_tags text[] not null default '{}',
  component_path text not null,
  created_at timestamptz not null default now()
);

alter table public.template_shells enable row level security;

insert into public.template_shells (slug, industry_tags, component_path)
values ('home-services-v1', array['home-services','karting-recreation'], 'src/components/site-shell/shells/home-services-v1');
