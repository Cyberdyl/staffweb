import { useEffect, useState } from 'react'
import { CalendarClock, CalendarPlus, Loader2, Save, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from './Toast'
import { Modal } from './Modal'
import { Avatar } from './ui'
import { ScheduleModal } from './ScheduleModal'
import { AcceptStaffModal } from './AcceptStaffModal'
import { APPLICATION_STATUS } from '../lib/labels'
import { fmtDateTime, fmtSmartDay, fmtTime } from '../lib/format'
import type { Application, ApplicationStatus, Appointment } from '../lib/types'

const STATUSES: ApplicationStatus[] = ['en_attente', 'entretien', 'accepte', 'refuse']

function yn(v?: boolean | null): string {
  return v == null ? '—' : v ? 'Oui' : 'Non'
}

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
  const [acceptOpen, setAcceptOpen] = useState(false)

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

  const displayName =
    application.pseudo ?? application.profile?.username ?? 'Candidat'

  async function setStatus(status: ApplicationStatus) {
    // L'acceptation passe par la modale dédiée (ajout à l'effectif).
    if (status === 'accepte') {
      setAcceptOpen(true)
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('applications')
      .update({ status, reviewed_by: session!.user.id })
      .eq('id', application!.id)
    setSaving(false)
    if (error) return notify('Erreur : ' + error.message, 'error')
    notify(
      status === 'refuse'
        ? 'Candidature refusée. Le candidat reçoit un MP Discord.'
        : `Statut : ${APPLICATION_STATUS[status].label}`,
      status === 'refuse' ? 'info' : 'success'
    )
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
        open={open && !scheduleOpen && !acceptOpen}
        onClose={onClose}
        size="lg"
        title="Candidature"
      >
        {/* En-tête candidat */}
        <div className="mb-5 flex items-center gap-3">
          <Avatar
            src={application.profile?.avatar_url}
            name={displayName}
            size={48}
          />
          <div className="flex-1">
            <p className="text-lg font-bold text-white">{displayName}</p>
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
          <Field k="Prénom" v={application.first_name} />
          <Field k="Pseudo" v={application.pseudo} />
          <Field k="Email (compte)" v={application.profile?.email} />
          <Field k="ID Discord" v={application.discord_user_id ?? application.profile?.discord_id} />
          <Field k="Âge" v={application.age?.toString()} />
          <Field k="Micro de qualité" v={yn(application.has_mic)} />
          <Field k="Découverte du serveur" v={application.discovery} full />
          <Field k="Sur FiveM depuis" v={application.fivem_since} />
          <Field k="Sur le serveur depuis" v={application.server_since} />
          <Field k="Temps de jeu" v={application.playtime} />
          <Field k="Déjà sanctionné" v={yn(application.sanctioned)} />
          {application.sanctioned && (
            <Field k="Raison de la sanction" v={application.sanctioned_reason} full />
          )}
          <Field k="Déjà staff FiveM" v={yn(application.was_staff)} />
          {application.was_staff && (
            <>
              <Field k="Serveur(s)" v={application.staff_servers} />
              <Field k="Poste occupé" v={application.staff_role} full />
            </>
          )}
          <Field k="Motivation" v={application.motivation} full />
          <Field k="Qualités d’un bon staff" v={application.qualities} full />
          <Field k="Réaction face à un joueur insultant" v={application.scenario} full />
          <Field k="Pourquoi lui" v={application.why_you} full />
          <Field k="Son apport" v={application.contribution} full />
          <Field k="Heures / semaine" v={application.hours_per_week} />
          <Field k="Horaires de dispo" v={application.availability} />
          <Field k="Règlement accepté" v={yn(application.rules_accepted)} />
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
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <MessageCircle className="h-3.5 w-3.5" />
            Accepté / Refusé : le candidat est prévenu automatiquement par MP
            Discord.
          </p>
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

      <AcceptStaffModal
        open={acceptOpen}
        onClose={() => setAcceptOpen(false)}
        application={application}
        onAccepted={onUpdated}
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
