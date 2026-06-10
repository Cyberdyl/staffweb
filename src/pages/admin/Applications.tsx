import { useEffect, useMemo, useState } from 'react'
import { Inbox, ChevronRight, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/Toast'
import { useRealtimeTable } from '../../lib/useRealtimeTable'
import { SectionTitle, Spinner, EmptyState, Avatar } from '../../components/ui'
import { ApplicationDetail } from '../../components/ApplicationDetail'
import { APPLICATION_STATUS } from '../../lib/labels'
import { fmtRelative } from '../../lib/format'
import type { Application, ApplicationStatus } from '../../lib/types'

type Filter = 'tous' | ApplicationStatus

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'tous', label: 'Toutes' },
  { id: 'en_attente', label: 'En attente' },
  { id: 'entretien', label: 'Entretien' },
  { id: 'accepte', label: 'Acceptées' },
  { id: 'refuse', label: 'Refusées' },
]

export default function Applications() {
  const { notify } = useToast()
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('tous')
  const [selected, setSelected] = useState<Application | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('applications')
      .select('*, profile:profiles!user_id(*), reviewer:profiles!reviewed_by(*)')
      .order('created_at', { ascending: false })
    if (error) notify('Erreur de chargement : ' + error.message, 'error')
    setApps((data as Application[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Liste mise à jour en direct (nouvelle candidature, statut changé…).
  useRealtimeTable('applications', load)

  const counts = useMemo(() => {
    const c: Record<string, number> = { tous: apps.length }
    for (const a of apps) c[a.status] = (c[a.status] ?? 0) + 1
    return c
  }, [apps])

  const filtered = useMemo(
    () => (filter === 'tous' ? apps : apps.filter((a) => a.status === filter)),
    [apps, filter]
  )

  return (
    <div>
      <div className="flex items-start justify-between">
        <SectionTitle hint="Examine, valide ou refuse les candidatures et planifie les entretiens.">
          Candidatures
        </SectionTitle>
        <button onClick={load} className="btn-ghost">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`chip ${
              filter === f.id
                ? 'bg-brand-600 text-white'
                : 'bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10'
            }`}
          >
            {f.label}
            <span className="opacity-70">{counts[f.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Chargement des candidatures…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-10 w-10" />}
          title="Aucune candidature"
          hint="Les nouvelles candidatures apparaîtront ici."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const st = APPLICATION_STATUS[a.status]
            return (
              <button
                key={a.id}
                onClick={() => {
                  setSelected(a)
                  setDetailOpen(true)
                }}
                className="card flex w-full items-center gap-4 p-4 text-left transition hover:border-brand-500/30 hover:bg-night-800/70"
              >
                <Avatar src={a.profile?.avatar_url} name={a.pseudo ?? a.profile?.username} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {a.pseudo ?? a.profile?.username ?? 'Candidat'}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {[
                      a.first_name,
                      a.age ? `${a.age} ans` : null,
                      fmtRelative(a.created_at),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <span className={`chip hidden sm:inline-flex ${st.cls}`}>
                  {st.label}
                </span>
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            )
          })}
        </div>
      )}

      <ApplicationDetail
        application={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={load}
      />
    </div>
  )
}
