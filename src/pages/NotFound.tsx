import { Link } from 'react-router-dom'
import { Ghost } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <Ghost className="h-12 w-12 text-slate-600" />
      <h1 className="font-display text-3xl font-bold text-white">404</h1>
      <p className="text-slate-400">Cette page n’existe pas.</p>
      <Link to="/" className="btn-primary mt-2">
        Retour à l’accueil
      </Link>
    </div>
  )
}
