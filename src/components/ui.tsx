import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import type { Grade, IgPermission } from '../lib/types'
import { POLES } from '../lib/config'
import { initials } from '../lib/format'

// ---- Logo ---------------------------------------------------------------
export function Logo({ size = 36, withGlow }: { size?: number; withGlow?: boolean }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.svg`}
      width={size}
      height={size}
      alt="Logo"
      style={{ width: size, height: size }}
      className={withGlow ? 'drop-shadow-[0_0_14px_rgba(51,133,255,0.55)]' : ''}
    />
  )
}

// ---- Avatar -------------------------------------------------------------
export function Avatar({
  src,
  name,
  size = 36,
}: {
  src?: string | null
  name?: string | null
  size?: number
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        width={size}
        height={size}
        className="rounded-full object-cover ring-1 ring-white/10"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-brand-700/40 text-xs font-bold text-brand-200 ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </div>
  )
}

// ---- Badge de permission IG --------------------------------------------
export function PermBadge({ perm }: { perm?: IgPermission | null }) {
  if (!perm)
    return (
      <span className="chip bg-white/5 text-slate-400 ring-1 ring-white/10">
        Aucune
      </span>
    )
  return (
    <span
      className="chip ring-1"
      style={{
        backgroundColor: `${perm.color}1f`,
        color: perm.color,
        boxShadow: `inset 0 0 0 1px ${perm.color}55`,
      }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: perm.color }}
      />
      {perm.label}
    </span>
  )
}

// ---- Badge de grade -----------------------------------------------------
export function GradeBadge({
  grade,
  pole,
}: {
  grade?: Grade | null
  pole?: string | null
}) {
  if (!grade)
    return <span className="text-sm text-slate-500">— sans grade —</span>
  const color = grade.color ?? '#94a3b8'
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="chip ring-1"
        style={{
          backgroundColor: `${color}1f`,
          color,
          boxShadow: `inset 0 0 0 1px ${color}55`,
        }}
      >
        {grade.label}
        {grade.short ? (
          <span className="opacity-60">· {grade.short}</span>
        ) : null}
      </span>
      {pole ? (
        <span className="chip bg-white/5 text-slate-300 ring-1 ring-white/10">
          {POLES[pole] ?? pole}
        </span>
      ) : null}
    </span>
  )
}

// ---- États génériques ---------------------------------------------------
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-16 text-center">
      {icon && <div className="text-slate-500">{icon}</div>}
      <p className="font-semibold text-slate-300">{title}</p>
      {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
      {action}
    </div>
  )
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-2xl font-bold tracking-tight text-white">
        {children}
      </h1>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </div>
  )
}
