import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, ShieldPlus, ShieldMinus, Search, Crown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../components/Toast'
import { SectionTitle, Spinner, Avatar, EmptyState } from '../../components/ui'
import type { AppRole, Profile } from '../../lib/types'

const ROLE_META: Record<AppRole, { label: string; cls: string }> = {
  applicant: { label: 'Candidat', cls: 'bg-white/5 text-slate-300 ring-1 ring-white/10' },
  manager: { label: 'Gérant staff', cls: 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30' },
  owner: { label: 'Propriétaire', cls: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30' },
}

export default function Managers() {
  const { session } = useAuth()
  const { notify } = useToast()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true })
      .order('username', { ascending: true })
    if (error) notify('Erreur : ' + error.message, 'error')
    setProfiles((data as Profile[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function setRole(p: Profile, role: AppRole) {
    setBusy(p.id)
    const { error } = await supabase.rpc('assign_role', {
      target: p.id,
      new_role: role,
    })
    setBusy(null)
    if (error) return notify('Erreur : ' + error.message, 'error')
    notify(
      role === 'manager'
        ? `${p.username} est désormais Gérant staff.`
        : `Rôle de ${p.username} retiré.`,
      'success'
    )
    load()
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles
    const q = search.toLowerCase()
    return profiles.filter(
      (p) =>
        p.username?.toLowerCase().includes(q) ||
        p.discord_id?.toLowerCase().includes(q)
    )
  }, [profiles, search])

  const managers = profiles.filter((p) => p.role === 'manager' || p.role === 'owner')

  return (
    <div>
      <SectionTitle hint="Attribue ou retire le rôle Gérant staff. Le Propriétaire se définit une seule fois en base (voir SETUP.md).">
        Gérants staff
      </SectionTitle>

      <div className="mb-5 flex items-center gap-3 rounded-xl bg-brand-600/10 p-4 text-sm text-brand-100">
        <ShieldCheck className="h-5 w-5 shrink-0 text-brand-300" />
        <p>
          <strong>{managers.length}</strong> personne(s) ont accès à
          l’administration. Seuls les Gérants et le Propriétaire peuvent gérer
          candidatures, calendrier et effectif.
        </p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-9"
          placeholder="Rechercher un membre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-10 w-10" />}
          title="Aucun membre"
          hint="Les personnes qui se connectent avec Discord apparaîtront ici."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const self = p.id === session!.user.id
            const meta = ROLE_META[p.role]
            return (
              <div key={p.id} className="card flex items-center gap-4 p-4">
                <Avatar src={p.avatar_url} name={p.username} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-white">
                    {p.username ?? 'Utilisateur'}
                    {self && (
                      <span className="text-xs font-normal text-slate-500">
                        (toi)
                      </span>
                    )}
                  </p>
                  {p.discord_id && (
                    <p className="truncate font-mono text-xs text-slate-500">
                      {p.discord_id}
                    </p>
                  )}
                </div>
                <span className={`chip ${meta.cls}`}>
                  {p.role === 'owner' && <Crown className="h-3 w-3" />}
                  {meta.label}
                </span>

                {/* Actions : on ne touche ni à soi-même ni aux propriétaires */}
                {p.role !== 'owner' && !self && (
                  <>
                    {p.role === 'manager' ? (
                      <button
                        onClick={() => setRole(p, 'applicant')}
                        disabled={busy === p.id}
                        className="btn-ghost"
                      >
                        <ShieldMinus className="h-4 w-4" /> Retirer
                      </button>
                    ) : (
                      <button
                        onClick={() => setRole(p, 'manager')}
                        disabled={busy === p.id}
                        className="btn-primary"
                      >
                        <ShieldPlus className="h-4 w-4" /> Promouvoir
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
