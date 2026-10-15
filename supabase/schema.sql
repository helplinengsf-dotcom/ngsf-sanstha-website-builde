-- Sanstha Builder: run ONLY in a brand-new Supabase project for this product.
-- Never run in the existing NGSF Admin project.
create extension if not exists pgcrypto;
create type public.org_role as enum ('owner','admin','editor');
create type public.publish_state as enum ('draft','published','archived');

create table public.organizations(
 id uuid primary key default gen_random_uuid(),
 name text not null,
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 organization_type text not null,
 description text not null default '',
 logo_url text,
 primary_color text not null default '#6255e7',
 contact_email text,
 contact_phone text,
 address text,
 custom_domain text unique,
 created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now()
);
create table public.organization_members(
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role public.org_role not null default 'editor',
 created_at timestamptz not null default now(),
 primary key(organization_id,user_id)
);
create table public.pages(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 title text not null, slug text not null,
 content jsonb not null default '{}'::jsonb,
 status public.publish_state not null default 'draft',
 created_at timestamptz not null default now(),
 unique(organization_id,slug)
);
create table public.news_events(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 content_type text not null check(content_type in ('news','event','activity')),
 title text not null, body text not null default '',
 image_url text, event_date timestamptz,
 status public.publish_state not null default 'draft',
 created_at timestamptz not null default now()
);
create table public.team_members(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 full_name text not null, position text not null default '',
 bio text not null default '', photo_url text,
 is_public boolean not null default true, sort_order integer not null default 0
);

create or replace function public.is_org_member(org_id uuid, roles public.org_role[])
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.organization_members m
 where m.organization_id=org_id and m.user_id=auth.uid() and m.role=any(roles));
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.pages enable row level security;
alter table public.news_events enable row level security;
alter table public.team_members enable row level security;

create policy "create organization as self" on public.organizations
for insert to authenticated with check(created_by=auth.uid());
create policy "members view organization" on public.organizations
for select to authenticated using(is_org_member(id,array['owner','admin','editor']::public.org_role[]));
create policy "admins update organization" on public.organizations
for update to authenticated using(is_org_member(id,array['owner','admin']::public.org_role[]))
with check(is_org_member(id,array['owner','admin']::public.org_role[]));

create policy "view own membership" on public.organization_members
for select to authenticated using(user_id=auth.uid() or is_org_member(organization_id,array['owner','admin']::public.org_role[]));
create policy "admins manage membership" on public.organization_members
for all to authenticated using(is_org_member(organization_id,array['owner','admin']::public.org_role[]))
with check(is_org_member(organization_id,array['owner','admin']::public.org_role[]));

create policy "org members read pages" on public.pages for select to authenticated
using(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]));
create policy "org members add pages" on public.pages for insert to authenticated
with check(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]));
create policy "org members edit pages" on public.pages for update to authenticated
using(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]))
with check(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]));
create policy "org admins delete pages" on public.pages for delete to authenticated
using(is_org_member(organization_id,array['owner','admin']::public.org_role[]));

create policy "org members read news" on public.news_events for select to authenticated
using(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]));
create policy "org members add news" on public.news_events for insert to authenticated
with check(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]));
create policy "org members edit news" on public.news_events for update to authenticated
using(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]))
with check(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]));
create policy "org admins delete news" on public.news_events for delete to authenticated
using(is_org_member(organization_id,array['owner','admin']::public.org_role[]));

create policy "org members read team" on public.team_members for select to authenticated
using(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]));
create policy "org members add team" on public.team_members for insert to authenticated
with check(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]));
create policy "org members edit team" on public.team_members for update to authenticated
using(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]))
with check(is_org_member(organization_id,array['owner','admin','editor']::public.org_role[]));
create policy "org admins delete team" on public.team_members for delete to authenticated
using(is_org_member(organization_id,array['owner','admin']::public.org_role[]));

-- Production TODO: create owner membership transactionally during onboarding;
-- add public read-only access for published content; configure private storage;
-- test tenant isolation with two test organizations before enabling real users.
-- Never expose Supabase service-role keys in browser code.