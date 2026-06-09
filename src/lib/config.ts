// Configuration globale de l'application.
// Le nom du serveur est personnalisable via VITE_SERVER_NAME.

export const SERVER_NAME = import.meta.env.VITE_SERVER_NAME?.trim() || 'BlueStark'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ''

// true si la connexion Supabase est correctement configurée
export const IS_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// Les pôles utilisés par certains grades (I / L / E). Renommables ici.
export const POLES: Record<string, string> = {
  I: 'Illégal',
  L: 'Légal',
  E: 'Entreprise',
}
