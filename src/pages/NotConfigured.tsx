import { Database } from 'lucide-react'
import { Logo } from '../components/ui'

// Écran affiché quand les variables d'environnement Supabase ne sont pas définies.
export function NotConfigured() {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="card max-w-xl p-8">
        <div className="mb-5 flex items-center gap-3">
          <Logo size={44} withGlow />
          <h1 className="font-display text-xl font-bold text-white">
            Configuration requise
          </h1>
        </div>
        <p className="text-sm leading-relaxed text-slate-400">
          La connexion à Supabase n’est pas configurée. Crée un fichier{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-brand-200">
            .env
          </code>{' '}
          à la racine du projet (copie de{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-brand-200">
            .env.example
          </code>
          ) avec :
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-night-950 p-4 text-xs text-slate-300">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...`}
        </pre>
        <div className="mt-5 flex items-start gap-3 rounded-xl bg-brand-600/10 p-4 text-sm text-brand-100">
          <Database className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
          <p>
            Suis le guide <strong>SETUP.md</strong> pour créer le projet
            Supabase, lancer la migration SQL et brancher la connexion Discord.
          </p>
        </div>
      </div>
    </div>
  )
}
