-- Sylvan chronicle schema.
-- Owner and DM can write. Players can read. Anonymous roles have no access.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  system text not null default 'D&D 5e',
  starting_date date,
  created_at timestamptz not null default now(),
  constraint campaigns_name_not_blank check (char_length(btrim(name)) > 0),
  constraint campaigns_system_not_blank check (char_length(btrim(system)) > 0)
);

create table public.campaign_members (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  primary key (campaign_id, user_id),
  constraint campaign_members_role_check check (role in ('owner', 'dm', 'player'))
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  session_date date not null default current_date,
  title text not null,
  raw_notes text not null default '',
  summary text,
  created_at timestamptz not null default now(),
  constraint sessions_title_not_blank check (char_length(btrim(title)) > 0)
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  type text not null,
  title text not null,
  body text not null default '',
  -- parsed rows are rebuilt from notes. manual rows are kept across rebuilds.
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_type_check check (type in ('person', 'place', 'plot', 'unresolved', 'other')),
  constraint entries_source_check check (source in ('parsed', 'manual')),
  constraint entries_title_not_blank check (char_length(btrim(title)) > 0)
);

create index campaign_members_user_id_idx on public.campaign_members (user_id);
create index sessions_campaign_date_idx on public.sessions (campaign_id, session_date desc);
create index entries_campaign_type_idx on public.entries (campaign_id, type);
create index entries_session_id_idx on public.entries (session_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entries_set_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

create or replace function public.prevent_campaign_owner_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;
  return new;
end;
$$;

create trigger campaigns_prevent_owner_change
  before update on public.campaigns
  for each row execute function public.prevent_campaign_owner_change();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_new_campaign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.campaign_members (campaign_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger campaigns_add_owner
  after insert on public.campaigns
  for each row execute function public.handle_new_campaign();

-- Security definer so policies can ask "what is my role?" without
-- re-entering RLS on campaign_members (which would recurse).
create or replace function public.campaign_role(cid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.campaign_members m
  where m.campaign_id = cid
    and m.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.prevent_campaign_owner_change() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_campaign() from public;
revoke all on function public.campaign_role(uuid) from public;
grant execute on function public.campaign_role(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.sessions enable row level security;
alter table public.entries enable row level security;

revoke all on public.profiles from anon;
revoke all on public.campaigns from anon;
revoke all on public.campaign_members from anon;
revoke all on public.sessions from anon;
revoke all on public.entries from anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.campaign_members to authenticated;
grant select, insert, update, delete on public.sessions to authenticated;
grant select, insert, update, delete on public.entries to authenticated;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy campaigns_select
  on public.campaigns
  for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.campaign_role(id) is not null
  );

create policy campaigns_insert
  on public.campaigns
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy campaigns_update
  on public.campaigns
  for update
  to authenticated
  using (public.campaign_role(id) in ('owner', 'dm'))
  with check (public.campaign_role(id) in ('owner', 'dm'));

create policy campaigns_delete
  on public.campaigns
  for delete
  to authenticated
  using (public.campaign_role(id) = 'owner');

create policy campaign_members_select
  on public.campaign_members
  for select
  to authenticated
  using (public.campaign_role(campaign_id) is not null);

create policy campaign_members_insert
  on public.campaign_members
  for insert
  to authenticated
  with check (public.campaign_role(campaign_id) = 'owner');

create policy campaign_members_update
  on public.campaign_members
  for update
  to authenticated
  using (public.campaign_role(campaign_id) = 'owner')
  with check (public.campaign_role(campaign_id) = 'owner');

create policy campaign_members_delete
  on public.campaign_members
  for delete
  to authenticated
  using (public.campaign_role(campaign_id) = 'owner');

create policy sessions_select
  on public.sessions
  for select
  to authenticated
  using (public.campaign_role(campaign_id) is not null);

create policy sessions_insert
  on public.sessions
  for insert
  to authenticated
  with check (public.campaign_role(campaign_id) in ('owner', 'dm'));

create policy sessions_update
  on public.sessions
  for update
  to authenticated
  using (public.campaign_role(campaign_id) in ('owner', 'dm'))
  with check (public.campaign_role(campaign_id) in ('owner', 'dm'));

create policy sessions_delete
  on public.sessions
  for delete
  to authenticated
  using (public.campaign_role(campaign_id) in ('owner', 'dm'));

create policy entries_select
  on public.entries
  for select
  to authenticated
  using (public.campaign_role(campaign_id) is not null);

create policy entries_insert
  on public.entries
  for insert
  to authenticated
  with check (public.campaign_role(campaign_id) in ('owner', 'dm'));

create policy entries_update
  on public.entries
  for update
  to authenticated
  using (public.campaign_role(campaign_id) in ('owner', 'dm'))
  with check (public.campaign_role(campaign_id) in ('owner', 'dm'));

create policy entries_delete
  on public.entries
  for delete
  to authenticated
  using (public.campaign_role(campaign_id) in ('owner', 'dm'));
