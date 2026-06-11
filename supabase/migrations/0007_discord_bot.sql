-- ============================================================================
--  Bot Discord + réunion avancée.
--  (Déjà appliqué via MCP le 2026-06-11 — conservé ici comme référence.)
-- ============================================================================

-- UUID FiveM demandé dans la candidature
alter table public.applications add column if not exists fivem_uuid text;

-- Liaison Discord des grades et permissions IG
alter table public.grades add column if not exists discord_role_id text;
alter table public.ig_permissions add column if not exists discord_role_id text;

-- Permissions vues sur Discord mais absentes du seed initial
insert into public.ig_permissions (id, label, color, rank) values
  ('noir', 'Noir', '#6b7280', 55),
  ('rose', 'Rose', '#ec4899', 65)
on conflict (id) do nothing;

-- Mapping des rôles Discord (perms IG)
update public.ig_permissions set discord_role_id = v.rid
from (values
  ('bleu',   '1487834287666630661'),
  ('jaune',  '1487834287666630662'),
  ('orange', '1487834287666630663'),
  ('rouge',  '1487834287666630664'),
  ('noir',   '1487834287666630665'),
  ('violet', '1504948092678439065'),
  ('rose',   '1494386850692075691')
) as v(pid, rid)
where ig_permissions.id = v.pid;

-- Mapping des rôles Discord (grades)
update public.grades set discord_role_id = v.rid
from (values
  ('helpeur',           '1487834288127742009'),
  ('moderateur',        '1487834288127742010'),
  ('administrateur',    '1487834288127742011'),
  ('superadmin',        '1487834288140587078'),
  ('support-discord',   '1487834288127742008'),
  ('gerant-staff',      '1487834288140587081'),
  ('kings',             '1487834288152903701'),
  ('gestionnaire',      '1496580338107809892'),
  ('gerant-communaute', '1487834288127742006')
) as v(gid, rid)
where grades.id = v.gid;

-- Nouveau type d'évènement réunion
alter type review_type add value if not exists 'felicitation';

-- Config applicative (IDs Discord) : lecture gérants, écriture owner.
create table if not exists public.app_config (
  key text primary key,
  value text not null default ''
);
alter table public.app_config enable row level security;
drop policy if exists app_config_select on public.app_config;
create policy app_config_select on public.app_config for select
  using (public.is_manager());
drop policy if exists app_config_write on public.app_config;
create policy app_config_write on public.app_config for all
  using (public.is_owner()) with check (public.is_owner());

insert into public.app_config (key, value) values
  ('role_staff_base',    '1487835194051399863'),
  ('role_blacklist',     ''),
  ('role_warning_1',     '1487834288090124459'),
  ('role_warning_2',     '1487834288090124458'),
  ('role_warning_3',     '1487834288090124457'),
  ('role_pole_L',        '1487834288102834374'),
  ('role_pole_I',        '1487834288102834373'),
  ('role_pole_E',        '1487834288102834375'),
  ('announce_channel_id', '')
on conflict (key) do nothing;

-- Annotations de réunion : chaque gérant donne son avis, visible par tous.
create table if not exists public.staff_notes (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references public.staff_members (id) on delete cascade,
  author_id uuid references public.profiles (id),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists staff_notes_member_idx on public.staff_notes (staff_member_id);
alter table public.staff_notes enable row level security;
drop policy if exists staff_notes_select on public.staff_notes;
create policy staff_notes_select on public.staff_notes for select
  using (public.is_manager());
drop policy if exists staff_notes_insert on public.staff_notes;
create policy staff_notes_insert on public.staff_notes for insert
  with check (public.is_manager() and author_id = auth.uid());
drop policy if exists staff_notes_delete on public.staff_notes;
create policy staff_notes_delete on public.staff_notes for delete
  using (author_id = auth.uid() or public.is_owner());

-- Temps réel : effectif, évènements et annotations (bot + pages admin),
-- et payloads DELETE complets pour que le bot retire les rôles.
alter table public.staff_members replica identity full;
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='staff_members') then
    alter publication supabase_realtime add table public.staff_members;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='staff_reviews') then
    alter publication supabase_realtime add table public.staff_reviews;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='staff_notes') then
    alter publication supabase_realtime add table public.staff_notes;
  end if;
end $$;

notify pgrst, 'reload schema';
