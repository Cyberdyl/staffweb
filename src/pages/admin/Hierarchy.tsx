import { useMemo } from 'react'
import { Network, ShieldAlert, ArrowRight } from 'lucide-react'
import { useReference } from '../../lib/useReference'
import { SectionTitle, Spinner, PermBadge, GradeBadge } from '../../components/ui'
import { CATEGORY_LABEL } from '../../lib/labels'
import { POLES } from '../../lib/config'
import type { Grade } from '../../lib/types'

const CATEGORIES: Grade['category'][] = ['fondation', 'gestion', 'staff']

export default function Hierarchy() {
  const { grades, permissions, loading } = useReference()

  const byCat = useMemo(() => {
    const m: Record<string, Grade[]> = {}
    for (const g of grades) (m[g.category] ??= []).push(g)
    return m
  }, [grades])

  const permById = useMemo(
    () => Object.fromEntries(permissions.map((p) => [p.id, p])),
    [permissions]
  )

  if (loading) return <Spinner />

  return (
    <div>
      <SectionTitle hint="La hiérarchie Discord et les permissions IG associées.">
        Hiérarchie & Permissions
      </SectionTitle>

      {/* Permissions IG */}
      <div className="card mb-6 p-5">
        <h2 className="mb-3 font-semibold text-white">Permissions IG</h2>
        <div className="flex flex-wrap gap-2">
          {permissions.map((p) => (
            <PermBadge key={p.id} perm={p} />
          ))}
        </div>
      </div>

      {/* Grades par catégorie */}
      <div className="space-y-6">
        {CATEGORIES.map((cat) =>
          byCat[cat]?.length ? (
            <section key={cat}>
              <h2 className="mb-3 font-display text-lg font-bold text-white">
                {CATEGORY_LABEL[cat]}
              </h2>
              <div className="card divide-y divide-white/5 p-0">
                {byCat[cat].map((g) => {
                  const perm = g.default_permission_id
                    ? permById[g.default_permission_id]
                    : null
                  return (
                    <div
                      key={g.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-3"
                    >
                      <GradeBadge grade={g} />
                      {g.has_pole && (
                        <span className="text-xs text-slate-500">
                          pôle : {Object.values(POLES).join(' / ')}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-slate-600" />
                      <PermBadge perm={perm} />
                      {g.note && (
                        <span className="text-xs italic text-slate-500">
                          {g.note}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null
        )}
      </div>

      {/* Règles */}
      <div className="mt-6 card border-amber-500/20 bg-amber-500/5 p-5">
        <div className="mb-2 flex items-center gap-2 font-semibold text-amber-200">
          <ShieldAlert className="h-5 w-5" />
          Règles
        </div>
        <ul className="space-y-1.5 text-sm text-amber-100/90">
          <li>⚠️ S’auto-attribuer un rôle ou des permissions = BL.</li>
          <li>
            🐸 Avoir la perm Fonda IG = BL (peu importe qui te l’a mise, c’est à
            toi de venir la faire enlever).
          </li>
        </ul>
      </div>
    </div>
  )
}
