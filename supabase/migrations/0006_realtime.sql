-- ============================================================================
--  Active la diffusion temps réel (Supabase Realtime) sur les tables
--  consultées en direct : calendrier + candidatures.
--  Les événements respectent les règles RLS (un gérant reçoit tout,
--  un candidat ne reçoit que sa propre candidature).
--  (Déjà appliqué via MCP le 2026-06-10 — conservé ici comme référence.)
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'applications'
  ) then
    alter publication supabase_realtime add table public.applications;
  end if;
end $$;
