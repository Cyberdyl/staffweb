import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, IS_CONFIGURED } from './config'

// Client Supabase unique pour toute l'application.
// Flow PKCE + détection de la session dans l'URL : indispensable pour
// le retour de la connexion Discord sur un site statique (GitHub Pages).
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

export { IS_CONFIGURED }
