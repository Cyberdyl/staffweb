import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileQuestion, CalendarClock, MessageSquareText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { SectionTitle, Spinner, EmptyState } from '../components/ui'
import { APPLICATION_STATUS } from '../lib/labels'
import { fmtDateTime, fmtSmartDay, fmtTime } from '../lib/format'
import type { Application, Appointment } from '../lib/types'

export default function MyApplication() {
  const { session } = useAuth()
  const [app, setApp] = useState<Application | null>(null)
  const [appt, setAppt] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
      const application = (data?.[0] as Application) ?? null
      if (!active) return
      setApp(application)
      if (application) {
        const { data: ap } = await supabase
          .from('appointments')
          .select('*, manager:profiles!manager_id(*)')
          .eq('application_id', application.id)
          .order('scheduled_at', { ascending: true })
          .limit(1)
        if (active) setAppt((ap?.[0] as Appointment) ?? null)
      }
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [session])

  if (loading) return <Spinner label="Chargement de ta candidature…" />

  if (!app) {
    return (
      <>
        <SectionTitle>Ma candidature</SectionTitle>
        <EmptyState
          icon={<FileQuestion className="h-10 w-10" />}
          title="Aucune candidature"
          hint="Tu n’as pas encore postulé. Lance-toi quand tu veux !"
          action={
            <Link to="/postuler" className="btn-primary mt-1">
              Postuler
            </Link>
          }
        />
      </>
    )
  }

  const st = APPLICATION_STATUS[app.status]

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle hint={`Envoyée le ${fmtDateTime(app.created_at)}`}>
        Ma candidature
      </SectionTitle>

      {/* Statut */}
      <div className="card mb-5 flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Statut
          </p>
          <p className="mt-1 text-lg font-bold text-white">Candidature staff</p>
        </div>
        <span className={`chip ${st.cls}`}>{st.label}</span>
      </div>

      {/* Rendez-vous */}
      {appt && (
        <div className="card mb-5 p-5">
          <div className="mb-3 flex items-center gap-2 text-brand-300">
            <CalendarClock className="h-5 w-5" />
            <h3 className="font-semibold text-white">Entretien vocal prévu</h3>
          </div>
          <p className="text-2xl font-bold capitalize text-white">
            {fmtSmartDay(appt.scheduled_at)}
          </p>
          <p className="text-slate-400">
            à {fmtTime(appt.scheduled_at)} · {appt.duration_min} min
            {appt.manager?.username ? ` · avec ${appt.manager.username}` : ''}
          </p>
          {appt.note && (
            <p className="mt-3 rounded-lg bg-white/5 p-3 text-sm text-slate-300">
              {appt.note}
            </p>
          )}
        </div>
      )}

      {/* Note du staff */}
      {app.review_note && (
        <div className="card mb-5 p-5">
          <div className="mb-2 flex items-center gap-2 text-brand-300">
            <MessageSquareText className="h-5 w-5" />
            <h3 className="font-semibold text-white">Message du staff</h3>
          </div>
          <p className="text-sm text-slate-300">{app.review_note}</p>
        </div>
      )}

      {/* Récap des réponses */}
      <div className="card p-5">
        <h3 className="mb-3 font-semibold text-white">Tes réponses</h3>
        <dl className="space-y-3 text-sm">
          <Row k="Prénom" v={app.first_name} />
          <Row k="Pseudo" v={app.pseudo} />
          <Row k="ID Discord" v={app.discord_user_id} />
          <Row k="Âge" v={app.age?.toString()} />
          <Row k="Micro de qualité" v={yn(app.has_mic)} />
          <Row k="Découverte du serveur" v={app.discovery} />
          <Row k="Sur FiveM depuis" v={app.fivem_since} />
          <Row k="Sur le serveur depuis" v={app.server_since} />
          <Row k="Temps de jeu" v={app.playtime} />
          <Row k="Déjà sanctionné" v={yn(app.sanctioned)} />
          <Row k="Raison de la sanction" v={app.sanctioned_reason} />
          <Row k="Déjà staff FiveM" v={yn(app.was_staff)} />
          <Row k="Serveur(s)" v={app.staff_servers} />
          <Row k="Poste occupé" v={app.staff_role} />
          <Row k="Motivation" v={app.motivation} />
          <Row k="Qualités d’un bon staff" v={app.qualities} />
          <Row k="Mise en situation" v={app.scenario} />
          <Row k="Pourquoi toi" v={app.why_you} />
          <Row k="Ton apport" v={app.contribution} />
          <Row k="Heures / semaine" v={app.hours_per_week} />
          <Row k="Horaires de dispo" v={app.availability} />
          <Row k="Règlement accepté" v={yn(app.rules_accepted)} />
          <Row k="Infos complémentaires" v={app.extra} />
        </dl>
      </div>
    </div>
  )
}

function yn(v?: boolean | null): string | null {
  return v == null ? null : v ? 'Oui' : 'Non'
}

function Row({ k, v }: { k: string; v?: string | null }) {
  if (!v) return null
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-t border-white/5 pt-3 first:border-0 first:pt-0">
      <dt className="text-slate-500">{k}</dt>
      <dd className="whitespace-pre-wrap text-slate-200">{v}</dd>
    </div>
  )
}
