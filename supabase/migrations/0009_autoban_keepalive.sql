-- ============================================================================
--  Salon "blacklist" (ban auto), rôle à ping demande de perm, keepalive.
--  (Déjà appliqué via MCP — conservé ici comme référence.)
-- ============================================================================

insert into public.app_config (key, value) values
  ('autoban_channel_id', '1496041994961817621'),
  ('role_perm_ping',     '1512514222343327987')
on conflict (key) do update set value = excluded.value;

-- Table de maintien en éveil : le bot y écrit tous les 3 jours pour empêcher
-- la mise en veille du projet Supabase (offre gratuite).
create table if not exists public.keepalive (
  id int primary key default 1,
  last_ping timestamptz not null default now()
);
insert into public.keepalive (id) values (1) on conflict (id) do nothing;
alter table public.keepalive enable row level security;
-- Pas de policy : seule la clé service_role (le bot) peut y écrire.

notify pgrst, 'reload schema';
