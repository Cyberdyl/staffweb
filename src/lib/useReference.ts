import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Grade, IgPermission } from './types'

// Charge les tables de référence (grades + permissions IG), triées par rang.
// `reload` permet de rafraîchir après une édition (page Hiérarchie, owner).
export function useReference() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [permissions, setPermissions] = useState<IgPermission[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const [g, p] = await Promise.all([
      supabase.from('grades').select('*').order('rank', { ascending: true }),
      supabase.from('ig_permissions').select('*').order('rank', { ascending: false }),
    ])
    setGrades((g.data as Grade[]) ?? [])
    setPermissions((p.data as IgPermission[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { grades, permissions, loading, reload }
}
