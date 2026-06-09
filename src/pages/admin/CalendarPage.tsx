import { useEffect, useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  format,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarPlus, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/Toast'
import { SectionTitle, Spinner } from '../../components/ui'
import { ScheduleModal } from '../../components/ScheduleModal'
import { fmtTime, fmtSmartDay } from '../../lib/format'
import type { Appointment, Application } from '../../lib/types'

const MANAGER_COLORS = ['#3385ff', '#22c55e', '#a855f7', '#f97316', '#ec4899', '#14b8a6', '#eab308']
function managerColor(id?: string | null) {
  if (!id) return '#64748b'
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return MANAGER_COLORS[h % MANAGER_COLORS.length]
}

function applicantName(a: Appointment) {
  return a.application?.pseudo ?? a.application?.profile?.username ?? 'Candidat'
}

export default function CalendarPage() {
  const { notify } = useToast()
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [appts, setAppts] = useState<Appointment[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)

  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  )

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select(
        '*, manager:profiles!manager_id(*), application:applications!application_id(*, profile:profiles!user_id(*))'
      )
      .gte('scheduled_at', gridStart.toISOString())
      .lte('scheduled_at', gridEnd.toISOString())
      .order('scheduled_at', { ascending: true })
    if (error) notify('Erreur : ' + error.message, 'error')
    setAppts((data as Appointment[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor])

  useEffect(() => {
    supabase
      .from('applications')
      .select('*, profile:profiles!user_id(*)')
      .neq('status', 'refuse')
      .order('created_at', { ascending: false })
      .then(({ data }) => setApplications((data as Application[]) ?? []))
  }, [])

  const byDay = useMemo(() => {
    const m = new Map<string, Appointment[]>()
    for (const a of appts) {
      const k = format(new Date(a.scheduled_at), 'yyyy-MM-dd')
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(a)
    }
    return m
  }, [appts])

  const upcoming = useMemo(
    () => [...appts].filter((a) => new Date(a.scheduled_at) >= new Date()),
    [appts]
  )

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (a: Appointment) => {
    setEditing(a)
    setModalOpen(true)
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle hint="Rendez-vous vocaux partagés : qui gère qui et quand.">
          Calendrier
        </SectionTitle>
        <button onClick={openNew} className="btn-primary">
          <CalendarPlus className="h-4 w-4" /> Nouveau RDV
        </button>
      </div>

      {/* Navigation mois */}
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => setCursor(addMonths(cursor, -1))} className="btn-ghost px-2">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[180px] text-center font-display text-lg font-bold capitalize text-white">
          {format(cursor, 'MMMM yyyy', { locale: fr })}
        </span>
        <button onClick={() => setCursor(addMonths(cursor, 1))} className="btn-ghost px-2">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button onClick={() => setCursor(startOfMonth(new Date()))} className="btn-ghost ml-1">
          Aujourd’hui
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Grille */}
          <div className="card overflow-hidden p-2">
            <div className="grid grid-cols-7 border-b border-white/5 pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const items = byDay.get(key) ?? []
                const muted = !isSameMonth(day, cursor)
                const today = isSameDay(day, new Date())
                return (
                  <div
                    key={key}
                    className={`min-h-[92px] border-b border-r border-white/5 p-1.5 ${
                      muted ? 'opacity-40' : ''
                    }`}
                  >
                    <div
                      className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        today ? 'bg-brand-600 font-bold text-white' : 'text-slate-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {items.slice(0, 3).map((a) => (
                        <button
                          key={a.id}
                          onClick={() => openEdit(a)}
                          className="block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium text-white"
                          style={{ backgroundColor: managerColor(a.manager_id) + '33', borderLeft: `3px solid ${managerColor(a.manager_id)}` }}
                          title={`${fmtTime(a.scheduled_at)} ${applicantName(a)} — ${a.manager?.username ?? ''}`}
                        >
                          {fmtTime(a.scheduled_at)} {applicantName(a)}
                        </button>
                      ))}
                      {items.length > 3 && (
                        <p className="px-1 text-[10px] text-slate-500">
                          +{items.length - 3} autre(s)
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Agenda */}
          <div>
            <h3 className="mb-3 font-semibold text-white">À venir ce mois-ci</h3>
            {upcoming.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                Aucun rendez-vous à venir.
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openEdit(a)}
                    className="card flex w-full items-start gap-3 p-3 text-left hover:border-brand-500/30"
                  >
                    <span
                      className="mt-1 h-8 w-1 rounded-full"
                      style={{ backgroundColor: managerColor(a.manager_id) }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {applicantName(a)}
                      </p>
                      <p className="flex items-center gap-1 text-xs capitalize text-slate-400">
                        <Clock className="h-3 w-3" />
                        {fmtSmartDay(a.scheduled_at)} · {fmtTime(a.scheduled_at)}
                      </p>
                      <p className="truncate text-xs text-brand-300">
                        géré par {a.manager?.username ?? '—'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ScheduleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        applications={applications}
        existing={editing}
      />
    </div>
  )
}
