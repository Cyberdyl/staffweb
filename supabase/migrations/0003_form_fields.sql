-- ============================================================================
--  Champs du formulaire de candidature (questions BlueStark FA).
--  Idempotent : "add column if not exists". À exécuter dans le SQL Editor.
-- ============================================================================

alter table public.applications
  add column if not exists first_name       text,
  add column if not exists pseudo           text,
  add column if not exists discord_user_id  text,
  add column if not exists discovery        text,
  add column if not exists fivem_since      text,
  add column if not exists server_since     text,
  add column if not exists playtime         text,
  add column if not exists sanctioned       boolean,
  add column if not exists sanctioned_reason text,
  add column if not exists was_staff        boolean,
  add column if not exists staff_servers    text,
  add column if not exists staff_role       text,
  add column if not exists qualities        text,
  add column if not exists why_you          text,
  add column if not exists contribution     text,
  add column if not exists hours_per_week   text,
  add column if not exists rules_accepted   boolean;

notify pgrst, 'reload schema';
