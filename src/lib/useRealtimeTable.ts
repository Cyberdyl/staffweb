import { useEffect, useRef } from 'react'
import { supabase } from './supabase'

export interface RealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new: Record<string, any> | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  old: Record<string, any> | null
}

// S'abonne aux changements temps réel d'une table (INSERT/UPDATE/DELETE).
// Les événements reçus respectent les règles RLS de l'utilisateur connecté.
// Le callback est gardé dans une ref : pas de désabonnement à chaque rendu.
export function useRealtimeTable(
  table: string,
  onChange: (e: RealtimeEvent) => void
) {
  const cb = useRef(onChange)
  useEffect(() => {
    cb.current = onChange
  })

  useEffect(() => {
    const name = `rt-${table}-${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(name)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) =>
          cb.current({
            eventType: payload.eventType as RealtimeEvent['eventType'],
            new: (payload.new as RealtimeEvent['new']) ?? null,
            old: (payload.old as RealtimeEvent['old']) ?? null,
          })
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [table])
}
