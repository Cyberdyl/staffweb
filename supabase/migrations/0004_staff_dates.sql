-- ============================================================================
--  Dates de carrière staff : entrée dans le staff + dernier up.
--  (Déjà appliqué via MCP le 2026-06-10 — conservé ici comme référence.)
-- ============================================================================

alter table public.staff_members
  add column if not exists staff_since date,
  add column if not exists last_up_at timestamptz;

-- Quand un "up" est acté en réunion, met à jour la date du dernier up.
create or replace function public.touch_last_up()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.type = 'up' and new.status = 'acte' and old.status is distinct from 'acte' then
    update public.staff_members set last_up_at = now() where id = new.staff_member_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_touch_last_up on public.staff_reviews;
create trigger trg_touch_last_up
  after update on public.staff_reviews
  for each row execute function public.touch_last_up();

notify pgrst, 'reload schema';
