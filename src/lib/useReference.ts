import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Grade, IgPermission } from './types'

// Charge les tables de référence (grades + permissions IG), triées par rang.
export function useReference() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [permissions, setPermissions] = useState<IgPermission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from('grades').select('*').order('rank', { ascending: true }),
      supabase.from('ig_permissions').select('*').order('rank', { ascending: false }),
    ]).then(([g, p]) => {
      if (!active) return
      setGrades((g.data as Grade[]) ?? [])
      setPermissions((p.data as IgPermission[]) ?? [])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return { grades, permissions, loading }
}
