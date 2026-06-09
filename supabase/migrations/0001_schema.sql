-- ============================================================================
--  Recrutement & gestion staff FiveM — Schéma + sécurité (RLS)
--  À exécuter dans Supabase : SQL Editor > New query > coller > Run.
-- ============================================================================

-- ---------- Types -----------------------------------------------------------
create type app_role as enum ('applicant', 'manager', 'owner');
create type application_status as enum ('en_attente', 'entretien', 'accepte', 'refuse');
create type staff_status as enum ('actif', 'suspendu', 'parti', 'vire');
create type review_type as enum ('avertissement', 'up', 'down', 'vire', 'note', 'reset_perm');
create type review_status as enum ('a_traiter', 'acte', 'annule');

-- ---------- profiles --------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  discord_id text,
  username text,
  avatar_url text,
  email text,
  role app_role not null default 'applicant',
  created_at timestamptz not null default now()
);

-- ---------- Tables de référence (seedées) -----------------------------------
create table public.ig_permissions (
  id text primary key,
  label text not null,
  color text not null,
  rank int not null
);

create table public.grades (
  id text primary key,
  label text not null,
  short text,
  category text not null check (category in ('fondation', 'gestion', 'staff')),
  rank int not null,
  default_permission_id text references public.ig_permissions (id),
  has_pole boolean not null default false,
  note text,
  color text
);

-- ---------- applications ----------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  discord_tag text,
  age int,
  timezone text,
  availability text,
  experience text,
  motivation text,
  scenario text,
  tools_knowledge text,
  has_mic boolean,
  already_sanctioned text,
  extra text,
  status application_status not null default 'en_attente',
  reviewed_by uuid references public.profiles (id),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.applications (user_id);
create index on public.applications (status);

-- ---------- appointments (calendrier) ---------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications (id) on delete cascade,
  manager_id uuid references public.profiles (id),
  title text,
  scheduled_at timestamptz not null,
  duration_min int not null default 30,
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index on public.appointments (scheduled_at);

-- ---------- staff_members (effectif) ----------------------------------------
create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  unique_id text not null unique,
  display_name text not null,
  discord_id text,
  profile_id uuid references public.profiles (id) on delete set null,
  grade_id text references public.grades (id),
  pole text check (pole in ('I', 'L', 'E')),
  permission_id text references public.ig_permissions (id),
  perm_authorized boolean not null default false,
  status staff_status not null default 'actif',
  notes text,
  added_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- staff_reviews (réunion / sanctions / historique) ----------------
create table public.staff_reviews (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references public.staff_members (id) on delete cascade,
  type review_type not null,
  reason text,
  status review_status not null default 'a_traiter',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz
);
create index on public.staff_reviews (staff_member_id);
create index on public.staff_reviews (status);

-- ============================================================================
--  Fonctions de sécurité (SECURITY DEFINER => évitent la récursion RLS)
-- ============================================================================
create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('manager', 'owner')
  );
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

-- Création auto du profil à la première connexion Discord.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url, discord_id, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name',
      'Utilisateur'
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(
      new.raw_user_meta_data ->> 'provider_id',
      new.raw_user_meta_data ->> 'sub'
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Met à jour pseudo/avatar Discord du profil courant (appelé après login).
create or replace function public.sync_profile()
returns void language plpgsql security definer set search_path = public as $$
declare u record;
begin
  select * into u from auth.users where id = auth.uid();
  if not found then return; end if;
  update public.profiles set
    username = coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name',
      u.raw_user_meta_data ->> 'user_name',
      username
    ),
    avatar_url = coalesce(u.raw_user_meta_data ->> 'avatar_url', avatar_url),
    discord_id = coalesce(
      u.raw_user_meta_data ->> 'provider_id',
      u.raw_user_meta_data ->> 'sub',
      discord_id
    ),
    email = coalesce(u.email, email)
  where id = auth.uid();
end;
$$;

-- Attribution de rôle réservée au Propriétaire.
create or replace function public.assign_role(target uuid, new_role app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then
    raise exception 'Action réservée au Propriétaire';
  end if;
  update public.profiles set role = new_role where id = target;
end;
$$;

grant execute on function public.is_manager() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;
grant execute on function public.sync_profile() to authenticated;
grant execute on function public.assign_role(uuid, app_role) to authenticated;

-- ============================================================================
--  Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.appointments enable row level security;
alter table public.grades enable row level security;
alter table public.ig_permissions enable row level security;
alter table public.staff_members enable row level security;
alter table public.staff_reviews enable row level security;

-- profiles : on lit son propre profil ; les gérants lisent tout le monde.
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.is_manager());

-- applications
create policy "applications_insert_own" on public.applications for insert
  with check (user_id = auth.uid());
create policy "applications_select" on public.applications for select
  using (user_id = auth.uid() or public.is_manager());
create policy "applications_update_mgr" on public.applications for update
  using (public.is_manager()) with check (public.is_manager());
create policy "applications_delete_mgr" on public.applications for delete
  using (public.is_manager());

-- appointments : gérants partout ; le candidat voit son propre RDV.
create policy "appointments_select" on public.appointments for select
  using (
    public.is_manager()
    or exists (
      select 1 from public.applications a
      where a.id = appointments.application_id and a.user_id = auth.uid()
    )
  );
create policy "appointments_write_mgr" on public.appointments for all
  using (public.is_manager()) with check (public.is_manager());

-- grades / permissions : lecture gérants, écriture propriétaire.
create policy "grades_select" on public.grades for select
  using (public.is_manager());
create policy "grades_write_owner" on public.grades for all
  using (public.is_owner()) with check (public.is_owner());

create policy "perms_select" on public.ig_permissions for select
  using (public.is_manager());
create policy "perms_write_owner" on public.ig_permissions for all
  using (public.is_owner()) with check (public.is_owner());

-- effectif : lecture + écriture gérants & propriétaire.
create policy "staff_select" on public.staff_members for select
  using (public.is_manager());
create policy "staff_write_mgr" on public.staff_members for all
  using (public.is_manager()) with check (public.is_manager());

-- réunions / signalements : gérants & propriétaire.
create policy "reviews_select" on public.staff_reviews for select
  using (public.is_manager());
create policy "reviews_write_mgr" on public.staff_reviews for all
  using (public.is_manager()) with check (public.is_manager());
