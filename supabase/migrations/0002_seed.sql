-- ============================================================================
--  Données initiales : permissions IG + grades (hiérarchie Discord).
--  Idempotent : ré-exécutable sans doublon (on conflict do nothing).
--  Adapte librement couleurs / libellés à ta communauté.
-- ============================================================================

insert into public.ig_permissions (id, label, color, rank) values
  ('fondateur', 'Fondateur', '#f43f5e', 100),
  ('vert',      'Vert',      '#22c55e', 80),
  ('violet',    'Violet',    '#a855f7', 70),
  ('rouge',     'Rouge',     '#ef4444', 60),
  ('orange',    'Orange',    '#f97316', 50),
  ('jaune',     'Jaune',     '#eab308', 40),
  ('bleu',      'Bleu',      '#3b82f6', 30)
on conflict (id) do nothing;

insert into public.grades
  (id, label, short, category, rank, default_permission_id, has_pole, note, color) values
  -- Fondation / Co-Fondation
  ('fondateur',         'Fondateur',         null,  'fondation', 1,  'fondateur', false, null,                        '#ef4444'),
  ('co-fondateurs',     'Co-Fondateurs',     null,  'fondation', 2,  'violet',    false, 'Peut up Vert si bon travail','#a855f7'),
  ('bluestarkcorp',     'BlueStarkCorp',     null,  'fondation', 3,  'violet',    false, null,                        '#eab308'),
  ('gestionnaire',      'Gestionnaire',      null,  'fondation', 4,  'violet',    false, null,                        '#3b82f6'),
  -- Hiérarchie Gestion
  ('gerant-staff',      'Gérant Staff',      'GS',  'gestion',   5,  null,        false, 'Violet si bon travail',     '#3385ff'),
  ('gerant-pole',       'Gérant Pôle',       'GP',  'gestion',   6,  null,        true,  'Violet si bon travail',     '#a855f7'),
  ('kings',             'Kings',             null,  'gestion',   7,  'rouge',     false, null,                        '#94a3b8'),
  ('manager',           'Manager',           'MG',  'gestion',   8,  'rouge',     false, null,                        '#ef4444'),
  ('superviseur',       'Superviseur',       'SUP', 'gestion',   9,  'rouge',     false, null,                        '#a855f7'),
  ('gerant-communaute', 'Gérant Communauté', 'G-C', 'gestion',   10, 'orange',    false, null,                        '#22c55e'),
  ('gerant-bluestark',  'Gérant BlueStark',  'G-B', 'gestion',   11, 'orange',    false, null,                        '#3b82f6'),
  ('gerant-global',     'Gérant Global',     'GLO', 'gestion',   12, 'orange',    false, null,                        '#94a3b8'),
  ('gerant',            'Gérant',            'G',   'gestion',   13, 'orange',    true,  null,                        '#22c55e'),
  -- Hiérarchie Staff
  ('superadmin',        'SuperAdmin',        'S-A', 'staff',     14, 'jaune',     false, null,                        '#eab308'),
  ('administrateur',    'Administrateur',    'A',   'staff',     15, 'jaune',     false, null,                        '#d4a373'),
  ('moderateur',        'Modérateur',        'M',   'staff',     16, 'bleu',      false, null,                        '#22d3ee'),
  ('helpeur',           'Helpeur',           'H',   'staff',     17, 'bleu',      false, null,                        '#2dd4bf'),
  ('support-discord',   'Support Discord',   null,  'staff',     18, null,        false, 'Pas de permission IG',      '#64748b')
on conflict (id) do nothing;
