import { Link } from 'react-router-dom'
import {
  Send,
  UserCircle,
  ShieldCheck,
  MessageSquare,
  CalendarCheck,
  Headphones,
  Clock,
  HeartHandshake,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { SERVER_NAME } from '../lib/config'

const STEPS = [
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Connexion Discord',
    text: 'Identifie-toi en un clic avec ton compte Discord.',
  },
  {
    icon: <Send className="h-5 w-5" />,
    title: 'Candidature',
    text: 'Remplis le formulaire staff dédié au serveur.',
  },
  {
    icon: <Headphones className="h-5 w-5" />,
    title: 'Entretien vocal',
    text: 'Un gérant te fixe un rendez-vous vocal (selon ton profil).',
  },
  {
    icon: <CalendarCheck className="h-5 w-5" />,
    title: 'Décision',
    text: 'Tu suis l’avancement de ta candidature en direct.',
  },
]

const EXPECT = [
  { icon: <Clock className="h-5 w-5" />, t: 'Disponibilité', d: 'Du temps régulier à consacrer au serveur.' },
  { icon: <Headphones className="h-5 w-5" />, t: 'Micro fonctionnel', d: 'Indispensable pour la modération et les entretiens.' },
  { icon: <HeartHandshake className="h-5 w-5" />, t: 'Maturité & sang-froid', d: 'Gérer les conflits avec calme et impartialité.' },
  { icon: <MessageSquare className="h-5 w-5" />, t: 'Bonne communication', d: 'Clarté et respect envers joueurs et équipe.' },
]

export default function Home() {
  const { session, signInDiscord } = useAuth()

  return (
    <div className="space-y-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-night-850/60 px-6 py-14 sm:px-12 sm:py-20">
        <div className="absolute inset-0 -z-10 bg-grid-faint [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Recrutement ouvert
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Rejoins l’équipe staff de{' '}
            <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
              {SERVER_NAME}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
            Tu veux aider à faire vivre le serveur, modérer et accompagner les
            joueurs&nbsp;? Dépose ta candidature staff en quelques minutes.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {session ? (
              <>
                <Link to="/postuler" className="btn-primary">
                  <Send className="h-4 w-4" /> Postuler maintenant
                </Link>
                <Link to="/ma-candidature" className="btn-ghost">
                  <UserCircle className="h-4 w-4" /> Ma candidature
                </Link>
              </>
            ) : (
              <button onClick={signInDiscord} className="btn-primary">
                <ShieldCheck className="h-4 w-4" /> Se connecter avec Discord
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ÉTAPES */}
      <section>
        <h2 className="mb-6 text-center font-display text-2xl font-bold text-white">
          Comment ça marche&nbsp;?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600/15 text-brand-300">
                  {s.icon}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ATTENTES */}
      <section>
        <h2 className="mb-6 text-center font-display text-2xl font-bold text-white">
          Ce qu’on attend de toi
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXPECT.map((e) => (
            <div key={e.t} className="card p-5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-brand-300">
                {e.icon}
              </span>
              <h3 className="mt-3 font-semibold text-white">{e.t}</h3>
              <p className="mt-1 text-sm text-slate-400">{e.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bas */}
      <section className="card flex flex-col items-center gap-4 p-10 text-center">
        <h2 className="font-display text-2xl font-bold text-white">
          Prêt à tenter ta chance&nbsp;?
        </h2>
        <p className="max-w-md text-sm text-slate-400">
          Ça prend moins de 10 minutes. Sois honnête et précis dans tes
          réponses, ça fait toute la différence.
        </p>
        {session ? (
          <Link to="/postuler" className="btn-primary">
            <Send className="h-4 w-4" /> Déposer ma candidature
          </Link>
        ) : (
          <button onClick={signInDiscord} className="btn-primary">
            <ShieldCheck className="h-4 w-4" /> Commencer avec Discord
          </button>
        )}
      </section>
    </div>
  )
}
