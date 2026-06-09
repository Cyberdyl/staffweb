import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Pencil,
  Flag,
  RotateCcw,
  MoreVertical,
  UserX,
  Trash2,
  AlertTriangle,
  Lock,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../components/Toast'
import { useReference } from '../../lib/useReference'
import {
  SectionTitle,
  Spinner,
  EmptyState,
  Avatar,
  GradeBadge,
  PermBadge,
} from '../../components/ui'
import { StaffModal } from '../../components/StaffModal'
import { ReviewModal } from '../../components/ReviewModal'
import { STAFF_STATUS } from '../../lib/labels'
import type { StaffMember, StaffStatus } from '../../lib/types'

type Filter = 'actifs' | 'tous' | 'anciens'

export default function Roster() {
  const { session } = useAuth()
  const { notify } = useToast()
  const { grades, permissions } = useReference()

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [warnings, setWarnings] = useState<Record<string, number>>({})
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [filter, setFilter] = useState<Filter>('actifs')
  const [search, setSearch] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewStaff, setReviewStaff] = useState<StaffMember | null>(null)

  async function load() {
    setLoading(true)
    const [{ data: members, error }, { data: reviews }] = await Promise.all([
      supabase
        .from('staff_members')
        .select('*, grade:grades!grade_id(*), permission:ig_permissions!permission_id(*)'),
      supabase.from('staff_reviews').select('staff_member_id, type, status'),
    ])
    if (error) notify('Erreur : ' + error.message, 'error')

    const w: Record<string, number> = {}
    const p = new Set<string>()
    for (const r of reviews ?? []) {
      if (r.status !== 'annule' && r.type === 'avertissement')
        w[r.staff_member_id] = (w[r.staff_member_id] ?? 0) + 1
      if (r.status === 'a_traiter') p.add(r.staff_member_id)
    }
    setWarnings(w)
    setPending(p)

    const sorted = ((members as StaffMember[]) ?? []).sort((a, b) => {
      const ra = a.grade?.rank ?? 999
      const rb = b.grade?.rank ?? 999
      return ra - rb || a.display_name.localeCompare(b.display_name)
    })
    setStaff(sorted)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    let list = staff
    if (filter === 'actifs')
      list = list.filter((s) => s.status === 'actif' || s.status === 'suspendu')
    else if (filter === 'anciens')
      list = list.filter((s) => s.status === 'parti' || s.status === 'vire')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.display_name.toLowerCase().includes(q) ||
          s.unique_id.toLowerCase().includes(q)
      )
    }
    return list
  }, [staff, filter, search])

  // --- Actions ---
  async function resetPerm(s: StaffMember) {
    if (!confirm(`Reset des permissions de ${s.display_name} ?`)) return
    await supabase
      .from('staff_members')
      .update({ permission_id: null, perm_authorized: false })
      .eq('id', s.id)
    await supabase.from('staff_reviews').insert({
      staff_member_id: s.id,
      type: 'reset_perm',
      status: 'acte',
      created_by: session!.user.id,
      resolved_by: session!.user.id,
      resolved_at: new Date().toISOString(),
    })
    notify('Permissions réinitialisées.', 'info')
    load()
  }

  async function setStatus(s: StaffMember, status: StaffStatus) {
    await supabase.from('staff_members').update({ status }).eq('id', s.id)
    notify(`Statut : ${STAFF_STATUS[status].label}`, 'info')
    setMenuId(null)
    load()
  }

  async function remove(s: StaffMember) {
    if (!confirm(`Supprimer définitivement ${s.display_name} ? (irréversible)`))
      return
    await supabase.from('staff_members').delete().eq('id', s.id)
    notify('Staff supprimé.', 'info')
    setMenuId(null)
    load()
  }

  async function resetAllPerms() {
    if (
      !confirm(
        'Reset des permissions de TOUT l’effectif actif ? À utiliser avant un contrôle global.'
      )
    )
      return
    const ids = staff
      .filter((s) => s.status === 'actif' || s.status === 'suspendu')
      .map((s) => s.id)
    if (ids.length === 0) return
    await supabase
      .from('staff_members')
      .update({ permission_id: null, perm_authorized: false })
      .in('id', ids)
    notify('Toutes les permissions ont été réinitialisées.', 'success')
    load()
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle hint="La liste des staffs, leurs grades et leurs permissions IG.">
          Effectif staff
        </SectionTitle>
        <div className="flex gap-2">
          <button onClick={resetAllPerms} className="btn-ghost">
            <RotateCcw className="h-4 w-4" /> Reset perms
          </button>
          <button
            onClick={() => {
              setEditing(null)
              setEditOpen(true)
            }}
            className="btn-primary"
          >
            <UserPlus className="h-4 w-4" /> Ajouter
          </button>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['actifs', 'tous', 'anciens'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip capitalize ${
              filter === f
                ? 'bg-brand-600 text-white'
                : 'bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10'
            }`}
          >
            {f}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="input w-56 pl-9"
            placeholder="Rechercher (pseudo, ID)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Spinner label="Chargement de l’effectif…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Aucun staff"
          hint="Ajoute les membres de ton équipe pour suivre grades et permissions."
          action={
            <button
              onClick={() => {
                setEditing(null)
                setEditOpen(true)
              }}
              className="btn-primary mt-1"
            >
              <UserPlus className="h-4 w-4" /> Ajouter un staff
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const warns = warnings[s.id] ?? 0
            const isPending = pending.has(s.id)
            const archived = s.status === 'parti' || s.status === 'vire'
            return (
              <div
                key={s.id}
                className={`card flex items-center gap-4 p-4 ${
                  archived ? 'opacity-60' : ''
                }`}
              >
                <Avatar name={s.display_name} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{s.display_name}</p>
                    {warns > 0 && (
                      <span className="chip bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
                        <AlertTriangle className="h-3 w-3" /> {warns}
                      </span>
                    )}
                    {isPending && (
                      <span
                        className="h-2 w-2 rounded-full bg-brand-400"
                        title="En attente de réunion"
                      />
                    )}
                  </div>
                  <p className="truncate font-mono text-xs text-slate-500">
                    {s.unique_id}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <GradeBadge grade={s.grade} pole={s.pole} />
                    <PermBadge perm={s.permission} />
                    {s.permission &&
                      (s.perm_authorized ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> autorisé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Lock className="h-3.5 w-3.5" /> non autorisé
                        </span>
                      ))}
                  </div>
                </div>

                {/* Statut */}
                <span className={`chip hidden md:inline-flex ${STAFF_STATUS[s.status].cls}`}>
                  {STAFF_STATUS[s.status].label}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setReviewStaff(s)
                      setReviewOpen(true)
                    }}
                    title="Signaler (réunion)"
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-amber-300"
                  >
                    <Flag className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => resetPerm(s)}
                    title="Reset perm"
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-brand-300"
                  >
                    <RotateCcw className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(s)
                      setEditOpen(true)
                    }}
                    title="Modifier"
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  >
                    <Pencil className="h-4.5 w-4.5" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setMenuId(menuId === s.id ? null : s.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    >
                      <MoreVertical className="h-4.5 w-4.5" />
                    </button>
                    {menuId === s.id && (
                      <>
                        <button
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => setMenuId(null)}
                        />
                        <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-white/10 bg-night-800 py-1 shadow-xl">
                          {!archived && (
                            <MenuItem onClick={() => setStatus(s, 'vire')} danger>
                              <UserX className="h-4 w-4" /> Marquer viré
                            </MenuItem>
                          )}
                          {!archived && (
                            <MenuItem onClick={() => setStatus(s, 'parti')}>
                              <UserX className="h-4 w-4" /> Marquer parti
                            </MenuItem>
                          )}
                          {archived && (
                            <MenuItem onClick={() => setStatus(s, 'actif')}>
                              <CheckCircle2 className="h-4 w-4" /> Réactiver
                            </MenuItem>
                          )}
                          <MenuItem onClick={() => remove(s)} danger>
                            <Trash2 className="h-4 w-4" /> Supprimer
                          </MenuItem>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <StaffModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
        grades={grades}
        permissions={permissions}
        existing={editing}
      />
      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onSaved={load}
        staff={reviewStaff}
      />
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
        danger
          ? 'text-rose-300 hover:bg-rose-500/10'
          : 'text-slate-200 hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  )
}
