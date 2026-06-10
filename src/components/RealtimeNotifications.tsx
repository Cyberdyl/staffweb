import { useAuth } from '../lib/auth'
import { useToast } from './Toast'
import { useRealtimeTable } from '../lib/useRealtimeTable'

// Monté (dans Layout) uniquement pour les gérants connectés :
// toasts en direct quand une candidature arrive ou qu'un RDV est planifié.
export function RealtimeNotifications() {
  const { session } = useAuth()
  const { notify } = useToast()

  useRealtimeTable('applications', (e) => {
    if (e.eventType === 'INSERT') {
      const who = e.new?.pseudo ?? 'un candidat'
      notify(`📥 Nouvelle candidature de ${who} ! Va voir l'onglet Candidatures.`, 'info')
    }
  })

  useRealtimeTable('appointments', (e) => {
    // Ne pas notifier celui qui vient de créer le RDV.
    if (e.eventType === 'INSERT' && e.new?.created_by !== session?.user.id) {
      notify('📅 Nouveau rendez-vous ajouté au calendrier partagé.', 'info')
    }
  })

  return null
}
