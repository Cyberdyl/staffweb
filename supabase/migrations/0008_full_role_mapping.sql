-- ============================================================================
--  Mapping complet des rôles Discord (hiérarchie complète fournie le 2026-06-11)
--  + config bot : salon demande de perm, rôle BL, rôle à ping.
--  (Déjà appliqué via MCP — conservé ici comme référence.)
-- ============================================================================

update public.grades set discord_role_id = v.rid
from (values
  ('fondateur',         '1487834288169816436'),
  ('co-fondateurs',     '1487834288152903708'),
  ('bluestarkcorp',     '1510240207570600056'),
  ('gestionnaire',      '1496580338107809892'),
  ('gerant-staff',      '1487834288140587081'),
  ('gerant-pole',       '1509527807393402910'),
  ('kings',             '1487834288152903701'),
  ('manager',           '1509527808517345320'),
  ('superviseur',       '1509527806684565718'),
  ('gerant-communaute', '1509527805149581354'),
  ('gerant-bluestark',  '1509527804688076890'),
  ('gerant',            '1487834288140587079'),
  ('superadmin',        '1487834288140587078'),
  ('administrateur',    '1487834288127742011'),
  ('moderateur',        '1487834288127742010'),
  ('helpeur',           '1487834288127742009'),
  ('support-discord',   '1487834288127742008')
) as v(gid, rid)
where grades.id = v.gid;

insert into public.app_config (key, value) values
  ('announce_channel_id', '1512515057924444160'),
  ('role_blacklist',      '1487834287666630660'),
  ('role_perm_ping',      '1512514222343327987')
on conflict (key) do update set value = excluded.value;

notify pgrst, 'reload schema';
