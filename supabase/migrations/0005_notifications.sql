-- ============================================================================
--  Notifications Discord : table de secrets + triggers -> edge function.
--  (Déjà appliqué via MCP le 2026-06-10 — conservé ici comme référence.)
--
--  Le secret webhook est généré en base ; le token du bot Discord s'ajoute :
--    insert into public.app_secrets (key, value) values ('discord_bot_token', 'TOKEN')
--    on conflict (key) do update set value = excluded.value;
-- ============================================================================

create table if not exists public.app_secrets (
  key text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;
revoke all on table public.app_secrets from anon, authenticated;

create extension if not exists pg_net;

-- Appelle la fonction edge discord-notify (asynchrone, n'échoue jamais l'écriture).
create or replace function public.notify_discord(event_type text, app_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare ws text;
begin
  select value into ws from public.app_secrets where key = 'webhook_secret';
  if ws is null then return; end if;
  perform net.http_post(
    url := 'https://hukzmgsiiiiozvekirub.supabase.co/functions/v1/discord-notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', ws),
    body := jsonb_build_object('type', event_type, 'application_id', app_id)
  );
exception when others then
  raise warning 'notify_discord: %', sqlerrm;
end $$;

-- Nouvelle candidature -> MP à tous les gérants.
create or replace function public.on_application_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_discord('new_application', new.id);
  return new;
end $$;

drop trigger if exists trg_application_insert on public.applications;
create trigger trg_application_insert
  after insert on public.applications
  for each row execute function public.on_application_insert();

-- Décision (accepté / refusé) -> MP au candidat.
create or replace function public.on_application_decision()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_discord('application_decision', new.id);
  return new;
end $$;

drop trigger if exists trg_application_decision on public.applications;
create trigger trg_application_decision
  after update on public.applications
  for each row
  when (old.status is distinct from new.status and new.status in ('accepte', 'refuse'))
  execute function public.on_application_decision();

-- Secret webhook généré en base (la valeur ne quitte jamais Postgres).
insert into public.app_secrets (key, value)
values ('webhook_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

notify pgrst, 'reload schema';
