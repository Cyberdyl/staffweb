import { useEffect, useMemo, useState } from 'react'
import { ShieldAlert, ArrowRight, Pencil, Save, Loader2, Bot, Link2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../components/Toast'
import { Modal } from '../../components/Modal'
import { useReference } from '../../lib/useReference'
import { SectionTitle, Spinner, PermBadge, GradeBadge } from '../../components/ui'
import { CATEGORY_LABEL } from '../../lib/labels'
import { POLES } from '../../lib/config'
import type { Grade, IgPermission } from '../../lib/types'

const CATEGORIES: Grade['category'][] = ['fondation', 'gestion', 'staff']

// Clés de configuration Discord éditables par le propriétaire.
const CONFIG_KEYS: { key: string; label: string; hint?: string }[] = [
  { key: 'announce_channel_id', label: 'Salon des annonces de recrutement', hint: 'ID du salon où le bot poste UUID + @mention + grade' },
  { key: 'role_staff_base', label: 'Rôle « Staff BlueStark » (base)' },
  { key: 'role_blacklist', label: 'Rôle « Blacklisté Staff »', hint: 'Le bot refuse d’attribuer des rôles aux membres qui l’ont' },
  { key: 'role_warning_1', label: 'Rôle Avertissement 1' },
  { key: 'role_warning_2', label: 'Rôle Avertissement 2' },
  { key: 'role_warning_3', label: 'Rôle Avertissement 3' },
  { key: 'role_pole_L', label: `Rôle pôle ${POLES.L}` },
  { key: 'role_pole_I', label: `Rôle pôle ${POLES.I}` },
  { key: 'role_pole_E', label: `Rôle pôle ${POLES.E}` },
]

export default function Hierarchy() {
  const { isOwner } = useAuth()
  const { grades, permissions, loading, reload } = useReference()
  const [editGrade, setEditGrade] = useState<Grade | null>(null)
  const [editPerm, setEditPerm] = useState<IgPermission | null>(null)

  const byCat = useMemo(() => {
    const m: Record<string, Grade[]> = {}
    for (const g of grades) (m[g.category] ??= []).push(g)
    return m
  }, [grades])

  const permById = useMemo(
    () => Object.fromEntries(permissions.map((p) => [p.id, p])),
    [permissions]
  )

  if (loading) return <Spinner />

  return (
    <div>
      <SectionTitle hint="La hiérarchie Discord et les permissions IG associées.">
        Hiérarchie & Permissions
      </SectionTitle>

      {/* Permissions IG */}
      <div className="card mb-6 p-5">
        <h2 className="mb-3 font-semibold text-white">Permissions IG</h2>
        <div className="flex flex-wrap gap-2">
          {permissions.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1">
              <PermBadge perm={p} />
              {p.discord_role_id && (
                <Link2 className="h-3 w-3 text-slate-600" aria-label="Rôle Discord lié" />
              )}
              {isOwner && (
                <button
                  onClick={() => setEditPerm(p)}
                  className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-slate-200"
                  title="Modifier"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Grades par catégorie */}
      <div className="space-y-6">
        {CATEGORIES.map((cat) =>
          byCat[cat]?.length ? (
            <section key={cat}>
              <h2 className="mb-3 font-display text-lg font-bold text-white">
                {CATEGORY_LABEL[cat]}
              </h2>
              <div className="card divide-y divide-white/5 p-0">
                {byCat[cat].map((g) => {
                  const perm = g.default_permission_id
                    ? permById[g.default_permission_id]
                    : null
                  return (
                    <div
                      key={g.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-3"
                    >
                      <GradeBadge grade={g} />
                      {g.has_pole && (
                        <span className="text-xs text-slate-500">
                          pôle : {Object.values(POLES).join(' / ')}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-slate-600" />
                      <PermBadge perm={perm} />
                      {g.note && (
                        <span className="text-xs italic text-slate-500">
                          {g.note}
                        </span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-2">
                        {g.discord_role_id ? (
                          <span className="chip bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
                            <Bot className="h-3 w-3" /> rôle lié
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">non lié</span>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => setEditGrade(g)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null
        )}
      </div>

      {/* Règles */}
      <div className="mt-6 card border-amber-500/20 bg-amber-500/5 p-5">
        <div className="mb-2 flex items-center gap-2 font-semibold text-amber-200">
          <ShieldAlert className="h-5 w-5" />
          Règles
        </div>
        <ul className="space-y-1.5 text-sm text-amber-100/90">
          <li>⚠️ S’auto-attribuer un rôle ou des permissions = BL.</li>
          <li>
            🐸 Avoir la perm Fonda IG = BL (peu importe qui te l’a mise, c’est à
            toi de venir la faire enlever).
          </li>
        </ul>
      </div>

      {/* Config Discord (owner) */}
      {isOwner && <DiscordConfigCard />}

      <GradeEditModal
        grade={editGrade}
        permissions={permissions}
        onClose={() => setEditGrade(null)}
        onSaved={reload}
      />
      <PermEditModal
        perm={editPerm}
        onClose={() => setEditPerm(null)}
        onSaved={reload}
      />
    </div>
  )
}

// ---------------------------------------------------------------- Grade edit
function GradeEditModal({
  grade,
  permissions,
  onClose,
  onSaved,
}: {
  grade: Grade | null
  permissions: IgPermission[]
  onClose: () => void
  onSaved: () => void
}) {
  const { notify } = useToast()
  const [label, setLabel] = useState('')
  const [short, setShort] = useState('')
  const [color, setColor] = useState('#94a3b8')
  const [defaultPerm, setDefaultPerm] = useState('')
  const [roleId, setRoleId] = useState('')
  const [hasPole, setHasPole] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!grade) return
    setLabel(grade.label)
    setShort(grade.short ?? '')
    setColor(grade.color ?? '#94a3b8')
    setDefaultPerm(grade.default_permission_id ?? '')
    setRoleId(grade.discord_role_id ?? '')
    setHasPole(grade.has_pole)
  }, [grade])

  if (!grade) return null

  async function save() {
    if (!label.trim()) return notify('Le nom du grade est obligatoire.', 'error')
    setSaving(true)
    const { error } = await supabase
      .from('grades')
      .update({
        label: label.trim(),
        short: short.trim() || null,
        color,
        default_permission_id: defaultPerm || null,
        discord_role_id: roleId.trim() || null,
        has_pole: hasPole,
      })
      .eq('id', grade!.id)
    setSaving(false)
    if (error) return notify('Erreur : ' + error.message, 'error')
    notify('Grade mis à jour.', 'success')
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={!!grade}
      onClose={onClose}
      title={`Modifier — ${grade.label}`}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nom du grade *</label>
            <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div>
            <label className="label">Abréviation</label>
            <input className="input" value={short} onChange={(e) => setShort(e.target.value)} placeholder="ex. GS" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Couleur</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-night-900"
              />
              <input className="input font-mono" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Perm IG par défaut</label>
            <select className="input" value={defaultPerm} onChange={(e) => setDefaultPerm(e.target.value)}>
              <option value="">Aucune</option>
              {permissions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">ID du rôle Discord</label>
          <input
            className="input font-mono"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            placeholder="ex. 1487834288127742009"
          />
          <p className="mt-1 text-xs text-slate-500">
            Le bot attribue/retire automatiquement ce rôle sur Discord.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHasPole(!hasPole)}
          className={`btn w-full ${hasPole ? 'bg-brand-600 text-white' : 'bg-white/5 text-slate-300'}`}
        >
          Grade avec pôle ({Object.values(POLES).join(' / ')}) : {hasPole ? 'Oui' : 'Non'}
        </button>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------- Perm edit
function PermEditModal({
  perm,
  onClose,
  onSaved,
}: {
  perm: IgPermission | null
  onClose: () => void
  onSaved: () => void
}) {
  const { notify } = useToast()
  const [label, setLabel] = useState('')
  const [color, setColor] = useState('#3385ff')
  const [roleId, setRoleId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!perm) return
    setLabel(perm.label)
    setColor(perm.color)
    setRoleId(perm.discord_role_id ?? '')
  }, [perm])

  if (!perm) return null

  async function save() {
    if (!label.trim()) return notify('Le nom de la permission est obligatoire.', 'error')
    setSaving(true)
    const { error } = await supabase
      .from('ig_permissions')
      .update({
        label: label.trim(),
        color,
        discord_role_id: roleId.trim() || null,
      })
      .eq('id', perm!.id)
    setSaving(false)
    if (error) return notify('Erreur : ' + error.message, 'error')
    notify('Permission mise à jour.', 'success')
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={!!perm}
      onClose={onClose}
      title={`Modifier — Permission ${perm.label}`}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Nom *</label>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div>
          <label className="label">Couleur</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-night-900"
            />
            <input className="input font-mono" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">ID du rôle Discord (Permission - IG)</label>
          <input
            className="input font-mono"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            placeholder="ex. 1487834287666630661"
          />
        </div>
      </div>
    </Modal>
  )
}

// ----------------------------------------------------- Config Discord (bot)
function DiscordConfigCard() {
  const { notify } = useToast()
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('app_config')
      .select('*')
      .then(({ data }) => {
        const v: Record<string, string> = {}
        for (const row of data ?? []) v[row.key] = row.value
        setValues(v)
        setLoading(false)
      })
  }, [])

  async function save() {
    setSaving(true)
    const rows = CONFIG_KEYS.map((c) => ({ key: c.key, value: (values[c.key] ?? '').trim() }))
    const { error } = await supabase.from('app_config').upsert(rows)
    setSaving(false)
    if (error) return notify('Erreur : ' + error.message, 'error')
    notify('Configuration Discord enregistrée. Le bot la prendra en compte.', 'success')
  }

  return (
    <div className="card mt-6 p-5">
      <div className="mb-1 flex items-center gap-2 font-semibold text-white">
        <Bot className="h-5 w-5 text-brand-300" />
        Configuration Discord (bot)
      </div>
      <p className="mb-4 text-sm text-slate-400">
        IDs utilisés par le bot pour synchroniser les rôles et poster les
        annonces. Réservé au Propriétaire.
      </p>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {CONFIG_KEYS.map((c) => (
              <div key={c.key}>
                <label className="label">{c.label}</label>
                <input
                  className="input font-mono"
                  value={values[c.key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [c.key]: e.target.value }))}
                  placeholder="ID Discord"
                />
                {c.hint && <p className="mt-1 text-xs text-slate-500">{c.hint}</p>}
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving} className="btn-primary mt-4">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer la configuration
          </button>
        </>
      )}
    </div>
  )
}
