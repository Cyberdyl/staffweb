import { useEffect, useState } from 'react'
import { CalendarClock, CalendarPlus, Loader2, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from './Toast'
import { Modal } from './Modal'
import { Avatar } from './ui'
import { ScheduleModal } from './ScheduleModal'
import { APPLICATION_STATUS } from '../lib/labels'
import { fmtDateTime, fmtSmartDay, fmtTime } from '../lib/format'
import type { Application, ApplicationStatus, Appointment } from '../lib/types'

const STATUSES: ApplicationStatus[] = ['en_attente', 'entretien', 'accepte', 'refuse']

export function ApplicationDetail({
  application,
  open,
  onClose,
  onUpdated,
}: {
  application: Application | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
}) {
  const { session } = useAuth()
  const { notify } = useToast()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [appt, setAppt] = useState<Appointment | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const loadAppt = async () => {
    if (!application) return
    const { data } = await supabase
      .from('appointments')
      .select('*, manager:profiles!manager_id(*)')
      .eq('application_id', application.id)
      .order('scheduled_at', { ascending: true })
      .limit(1)
    setAppt((data?.[0] as Appointment) ?? null)
  }

  useEffect(() => {
    if (open && application) {
      setNote(application.review_note ?? '')
      loadAppt()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, application])

  if (!application) return null

  async function setStatus(status: ApplicationStatus) {
    setSaving(true)
    const { error } = await supabase
      .from('applications')
      .update({ status, reviewed_by: session!.user.id })
      .eq('id', application!.id)
    setSaving(false)
    if (error) return notify('Erreur : ' + error.message, 'error')
    notify(`Statut : ${APPLICATION_STATUS[status].label}`, 'success')
    onUpdated()
  }

  async function saveNote() {
    setSaving(true)
    const { error } = await supabase
      .from('applications')
      .update({ review_note: note || null, reviewed_by: session!.user.id })
      .eq('id', application!.id)
    setSaving(false)
    if (error) return notify('Erreur : ' + error.message, 'error')
    notify('Note enregistrée.', 'success')
    onUpdated()
  }

  return (
    <>
      <Modal
        open={open && !scheduleOpen}
        onClose={onClose}
        size="lg"
        title="Candidature"
      >
        {/* En-tête candidat */}
        <div className="mb-5 flex items-center gap-3">
          <Avatar src={application.profile?.avatar_url} name={application.profile?.username} size={48} />
          <div className="flex-1">
            <p className="text-lg font-bold text-white">
              {application.profile?.username ?? application.discord_tag ?? 'Candidat'}
            </p>
            <p className="text-xs text-slate-500">
              Envoyée le {fmtDateTime(application.created_at)}
            </p>
          </div>
          <span className={`chip ${APPLICATION_STATUS[application.status].cls}`}>
            {APPLICATION_STATUS[application.status].label}
          </span>
        </div>

        {/* Réponses */}
        <div className="mb-5 grid gap-3 rounded-xl bg-night-900/60 p-4 text-sm sm:grid-cols-2">
          <Field k="Âge" v={application.age?.toString()} />
          <Field k="Pays / fuseau" v={application.timezone} />
          <Field k="Disponibilités" v={application.availability} />
          <Field k="Micro" v={application.has_mic == null ? '—' : application.has_mic ? 'Oui' : 'Non'} />
          <Field k="Motivation" v={application.motivation} full />
          <Field k="Expérience" v={application.experience} full />
          <Field k="Mise en situation" v={application.scenario} full />
          <Field k="Outils (txAdmin…)" v={application.tools_knowledge} full />
          <Field k="Déjà sanctionné" v={application.already_sanctioned} full />
          <Field k="Infos complémentaires" v={application.extra} full />
        </div>

        {/* Rendez-vous */}
        <div className="mb-5">
          <p className="label">Rendez-vous vocal (facultatif)</p>
          {appt ? (
            <button
              onClick={() => setScheduleOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-600/10 p-3 text-left hover:bg-brand-600/15"
            >
              <CalendarClock className="h-5 w-5 text-brand-300" />
              <span className="flex-1">
                <span className="block font-semibold capitalize text-white">
                  {fmtSmartDay(appt.scheduled_at)} à {fmtTime(appt.scheduled_at)}
                </span>
                <span className="text-xs text-slate-400">
                  {appt.duration_min} min · cliquer pour modifier
                </span>
              </span>
            </button>
          ) : (
            <button onClick={() => setScheduleOpen(true)} className="btn-ghost w-full">
              <CalendarPlus className="h-4 w-4" /> Planifier un rendez-vous
            </button>
          )}
        </div>

        {/* Note interne / message */}
        <div className="mb-5">
          <label className="label">Note / message au candidat</label>
          <textarea
            className="input min-h-[80px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Visible par le candidat sur sa page de suivi."
          />
          <button onClick={saveNote} disabled={saving} className="btn-ghost mt-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer la note
          </button>
        </div>

        {/* Statut */}
        <div>
          <p className="label">Changer le statut</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUSES.map((s) => {
              const active = application.status === s
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  disabled={saving}
                  className={`btn ${
                    active
                      ? 'bg-brand-600 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {APPLICATION_STATUS[s].label}
                </button>
              )
            })}
          </div>
        </div>
      </Modal>

      <ScheduleModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSaved={loadAppt}
        applications={[application]}
        presetApplicationId={application.id}
        existing={appt}
      />
    </>
  )
}

function Field({ k, v, full }: { k: string; v?: string | null; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{k}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-slate-200">{v || '—'}</p>
    </div>
  )
}
