import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Check, X, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../components/Toast'
import { SectionTitle, Spinner, EmptyState, GradeBadge } from '../../components/ui'
import { REVIEW_TYPE } from '../../lib/labels'
import { fmtRelative } from '../../lib/format'
import type { ReviewType, StaffReview } from '../../lib/types'

const ORDER: ReviewType[] = ['avertissement', 'up', 'down', 'vire', 'note']

export default function Meeting() {
  const { session } = useAuth()
  const { notify } = useToast()
  const [reviews, setReviews] = useState<StaffReview[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('staff_reviews')
      .select(
        '*, staff_member:staff_members!staff_member_id(*, grade:grades!grade_id(*)), author:profiles!created_by(*)'
      )
      .eq('status', 'a_traiter')
      .order('created_at', { ascending: true })
    if (error) notify('Erreur : ' + error.message, 'error')
    setReviews((data as StaffReview[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const grouped = useMemo(() => {
    const g: Record<string, StaffReview[]> = {}
    for (const r of reviews) (g[r.type] ??= []).push(r)
    return g
  }, [reviews])

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
    // Si on acte un renvoi, on archive aussi le staff.
    if (status === 'acte' && r.type === 'vire' && r.staff_member_id) {
      await supabase
        .from('staff_members')
        .update({ status: 'vire' })
        .eq('id', r.staff_member_id)
    }
    notify(status === 'acte' ? 'Décision actée.' : 'Annulé.', status === 'acte' ? 'success' : 'info')
    load()
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <SectionTitle hint="Tout ce qui est en attente pour la prochaine réunion staff.">
          Réunion staff
        </SectionTitle>
        <button onClick={load} className="btn-ghost">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Rien à traiter"
          hint="Signale des staffs depuis l’Effectif (avertissement, up, down, viré…) pour préparer la prochaine réunion."
        />
      ) : (
        <div className="space-y-6">
          {ORDER.filter((t) => grouped[t]?.length).map((type) => {
            const meta = REVIEW_TYPE[type]
            const items = grouped[type]
            return (
              <section key={type}>
                <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-white">
                  <span>{meta.emoji}</span>
                  {meta.label}
                  <span className="chip bg-white/5 text-slate-400 ring-1 ring-white/10">
                    {items.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {items.map((r) => (
                    <div key={r.id} className="card flex items-start gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">
                            {r.staff_member?.display_name ?? 'Staff'}
                          </p>
                          <GradeBadge grade={r.staff_member?.grade} pole={r.staff_member?.pole} />
                        </div>
                        {r.reason && (
                          <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-300">
                            {r.reason}
                          </p>
                        )}
                        <p className="mt-1.5 text-xs text-slate-500">
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
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
