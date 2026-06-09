import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Lock, ShieldAlert } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { Spinner } from './ui'

type Require = 'auth' | 'manager' | 'owner'

export function ProtectedRoute({
  require: req,
  children,
}: {
  require: Require
  children: ReactNode
}) {
  const { session, profile, loading, isManager, isOwner, signInDiscord } =
    useAuth()

  if (loading) return <Spinner label="Chargement…" />

  // Connexion requise
  if (!session) {
    return (
      <Gate
        icon={<Lock className="h-8 w-8" />}
        title="Connexion requise"
        message="Connecte-toi avec Discord pour accéder à cette page."
        action={
          <button onClick={signInDiscord} className="btn-primary">
            Se connecter avec Discord
          </button>
        }
      />
    )
  }

  // Profil pas encore chargé
  if (!profile) return <Spinner label="Chargement du profil…" />

  const ok =
    req === 'auth' ||
    (req === 'manager' && isManager) ||
    (req === 'owner' && isOwner)

  if (!ok) {
    return (
      <Gate
        icon={<ShieldAlert className="h-8 w-8" />}
        title="Accès réservé"
        message={
          req === 'owner'
            ? 'Seul le Propriétaire peut accéder à cette page.'
            : 'Cette section est réservée aux Gérants staff. Demande au Propriétaire de t’attribuer le rôle.'
        }
        action={
          <Link to="/" className="btn-ghost">
            Retour à l’accueil
          </Link>
        }
      />
    )
  }

  return <>{children}</>
}

function Gate({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode
  title: string
  message: string
  action: ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-white/5 bg-night-850/70 px-6 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600/10 text-brand-300">
        {icon}
      </div>
      <h2 className="font-display text-xl font-bold text-white">{title}</h2>
      <p className="text-sm text-slate-400">{message}</p>
      {action}
    </div>
  )
}
