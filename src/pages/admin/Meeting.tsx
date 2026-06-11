import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  Check,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  Flag,
  ArrowUpCircle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../components/Toast'
import { useRealtimeTable } from '../../lib/useRealtimeTable'
import {
  SectionTitle,
  Spinner,
  EmptyState,
  Avatar,
  GradeBadge,
} from '../../components/ui'
import { ReviewModal } from '../../components/ReviewModal'
import { REVIEW_TYPE } from '../../lib/labels'
import { fmtDate, fmtRelative } from '../../lib/format'
import type { StaffMember, StaffNote, StaffReview } from '../../lib/types'

export default function Meeting() {
  const { session, isOwner } = useAuth()
  const { notify } = useToast()

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [reviews, setReviews] = useState<StaffReview[]>([])
  const [notes, setNotes] = useState<StaffNote[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [reviewStaff, setReviewStaff] = useState<StaffMember | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  async function load() {
    const [s, r, n] = await Promise.all([
      supabase
        .from('staff_members')
        .select('*, grade:grades!grade_id(*), permission:ig_permissions!permission_id(*)')
        .in('status', ['actif', 'suspendu']),
      supabase
        .from('staff_reviews')
        .select('*, author:profiles!created_by(*)'),
      supabase
        .from('staff_notes')
        .select('*, author:profiles!author_id(*)')
        .order('created_at', { ascending: true }),
    ])
    const sorted = ((s.data as StaffMember[]) ?? []).sort((a, b) => {
      const ra = a.grade?.rank ?? 999
      const rb = b.grade?.rank ?? 999
      return ra - rb || a.display_name.localeCompare(b.display_name)
    })
    setStaff(sorted)
    setReviews((r.data as StaffReview[]) ?? [])
    setNotes((n.data as StaffNote[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tout se met à jour en direct pendant la réunion.
  useRealtimeTable('staff_members', load)
  useRealtimeTable('staff_reviews', load)
  useRealtimeTable('staff_notes', load)

  const stats = useMemo(() => {
    const m: Record<string, { warns: number; congrats: number }> = {}
    for (const r of reviews) {
      if (r.status === 'annule') continue
      const e = (m[r.staff_member_id] ??= { warns: 0, congrats: 0 })
      if (r.type === 'avertissement') e.warns++
      if (r.type === 'felicitation') e.congrats++
    }
    return m
  }, [reviews])

  const notesByStaff = useMemo(() => {
    const m: Record<string, StaffNote[]> = {}
    for (const n of notes) (m[n.staff_member_id] ??= []).push(n)
    return m
  }, [notes])

  const pending = useMemo(
    () =>
      reviews
        .filter((r) => r.status === 'a_traiter')
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [reviews]
  )

  const staffById = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.id, s])),
    [staff]
  )

  async function resolve(r: StaffReview, status: 'acte' | 'annule') {
    const { error } = await supabase
      .from('staff_reviews')
      .update({
        status,
        resolved_by: session!.user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', r.id)
    if (error) return notify('Erreur : ' + error.message, 'error')
    if (status === 'acte' && r.type === 'vire' && r.staff_member_id) {
      await supabase
        .from('staff_members')
        .update({ status: 'vire' })
        .eq('id', r.staff_member_id)
    }
    notify(status === 'acte' ? 'Décision actée.' : 'Annulé.', status === 'acte' ? 'success' : 'info')
    load()
  }

  async function addNote(staffId: string) {
    const content = (drafts[staffId] ?? '').trim()
    if (!content) return
    const { error } = await supabase.from('staff_notes').insert({
      staff_member_id: staffId,
      author_id: session!.user.id,
      content,
    })
    if (error) return notify('Erreur : ' + error.message, 'error')
    setDrafts((d) => ({ ...d, [staffId]: '' }))
    load()
  }

  async function deleteNote(n: StaffNote) {
    const { error } = await supabase.from('staff_notes').delete().eq('id', n.id)
    if (error) return notify('Erreur : ' + error.message, 'error')
    load()
  }

  if (loading) return <Spinner label="Préparation de la réunion…" />

  return (
    <div>
      <div className="flex items-start justify-between">
        <SectionTitle hint="Tableau de l'effectif trié par grade : avis partagés, ups, félicitations et avertissements.">
          Réunion staff
        </SectionTitle>
        <button onClick={load} className="btn-ghost">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      {/* ------------------------------------------- Décisions à acter */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 font-display text-lg font-bold text-white">
            Décisions à acter
            <span className="chip ml-2 bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
              {pending.length}
            </span>
          </h2>
          <div className="space-y-2">
            {pending.map((r) => {
              const meta = REVIEW_TYPE[r.type]
              const sm = staffById[r.staff_member_id]
              return (
                <div key={r.id} className="card flex items-start gap-3 p-4">
                  <span className={`chip shrink-0 ${meta.cls}`}>
                    {meta.emoji} {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">
                      {sm?.display_name ?? 'Staff'}
                    </p>
                    {r.reason && (
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-300">
                        {r.reason}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      signalé {fmtRelative(r.created_at)}
                      {r.author?.username ? ` par ${r.author.username}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => resolve(r, 'acte')}
                      title="Acter"
                      className="btn bg-emerald-600/90 px-3 text-white hover:bg-emerald-500"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => resolve(r, 'annule')}
                      title="Annuler"
                      className="btn bg-white/5 px-3 text-slate-300 hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ------------------------------------------- Tableau de l'effectif */}
      <h2 className="mb-2 font-display text-lg font-bold text-white">
        Tableau de l’effectif
      </h2>
      {staff.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Aucun staff actif"
          hint="Ajoute des membres dans l'Effectif pour préparer les réunions."
        />
      ) : (
        <div className="card divide-y divide-white/5 p-0">
          {/* En-tête */}
          <div className="hidden grid-cols-[1fr_130px_70px_70px_70px_90px] items-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:grid">
            <span>Staff</span>
            <span>Dernier up</span>
            <span className="text-center">🎉</span>
            <span className="text-center">⚠️</span>
            <span className="text-center">💬</span>
            <span className="text-right">Actions</span>
          </div>

          {staff.map((s) => {
            const st = stats[s.id] ?? { warns: 0, congrats: 0 }
            const sNotes = notesByStaff[s.id] ?? []
            const isOpen = expanded === s.id
            return (
              <div key={s.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className={`grid w-full grid-cols-[1fr_auto] items-center gap-2 px-4 py-3 text-left transition hover:bg-white/[0.03] md:grid-cols-[1fr_130px_70px_70px_70px_90px] ${
                    isOpen ? 'bg-white/[0.03]' : ''
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={s.display_name} size={34} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-white">
                        {s.display_name}
                      </span>
                      <GradeBadge grade={s.grade} pole={s.pole} />
                    </span>
                  </span>
                  <span className="hidden text-sm text-slate-400 md:block">
                    {s.last_up_at ? fmtDate(s.last_up_at) : '—'}
                  </span>
                  <span className="hidden text-center md:block">
                    {st.congrats > 0 ? (
                      <span className="chip bg-emerald-500/15 text-emerald-300">{st.congrats}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </span>
                  <span className="hidden text-center md:block">
                    {st.warns > 0 ? (
                      <span className="chip bg-amber-500/15 text-amber-300">{st.warns}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </span>
                  <span className="hidden text-center md:block">
                    {sNotes.length > 0 ? (
                      <span className="chip bg-brand-500/15 text-brand-300">{sNotes.length}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </span>
                  <span className="flex items-center justify-end gap-1">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        setReviewStaff(s)
                        setReviewOpen(true)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation()
                          setReviewStaff(s)
                          setReviewOpen(true)
                        }
                      }}
                      title="Signaler (up, avertissement, félicitations…)"
                      className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-amber-300"
                    >
                      <Flag className="h-4 w-4" />
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </span>
                </button>

                {/* Annotations */}
                {isOpen && (
                  <div className="border-t border-white/5 bg-night-900/40 px-4 py-4">
                    <div className="mb-1 flex items-center gap-4 text-xs text-slate-500 md:hidden">
                      <span className="inline-flex items-center gap-1">
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                        dernier up : {s.last_up_at ? fmtDate(s.last_up_at) : '—'}
                      </span>
                      <span>🎉 {st.congrats}</span>
                      <span>⚠️ {st.warns}</span>
                    </div>
                    <p className="label">Avis des gérants</p>
                    {sNotes.length === 0 ? (
                      <p className="mb-3 text-sm text-slate-500">
                        Aucun avis pour le moment — sois le premier !
                      </p>
                    ) : (
                      <div className="mb-3 space-y-2.5">
                        {sNotes.map((n) => {
                          const mine = n.author_id === session?.user.id
                          return (
                            <div key={n.id} className="flex items-start gap-2.5">
                              <Avatar
                                src={n.author?.avatar_url}
                                name={n.author?.username}
                                size={28}
                              />
                              <div className="min-w-0 flex-1 rounded-xl bg-white/5 px-3 py-2">
                                <p className="text-xs font-semibold text-brand-300">
                                  {n.author?.username ?? 'Gérant'}
                                  <span className="ml-2 font-normal text-slate-500">
                                    {fmtRelative(n.created_at)}
                                  </span>
                                </p>
                                <p className="whitespace-pre-wrap text-sm text-slate-200">
                                  {n.content}
                                </p>
                              </div>
                              {(mine || isOwner) && (
                                <button
                                  onClick={() => deleteNote(n)}
                                  title="Supprimer"
                                  className="rounded p-1.5 text-slate-600 hover:bg-white/5 hover:text-rose-300"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        className="input flex-1"
                        placeholder="Ton avis sur ce staff (visible par tous les gérants)…"
                        value={drafts[s.id] ?? ''}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [s.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && addNote(s.id)}
                      />
                      <button onClick={() => addNote(s.id)} className="btn-primary px-3">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onSaved={load}
        staff={reviewStaff}
      />
    </div>
  )
}
