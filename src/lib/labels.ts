import type { ApplicationStatus, ReviewType, StaffStatus } from './types'

// Libellés + styles (classes Tailwind) pour les différents statuts.

export const APPLICATION_STATUS: Record<
  ApplicationStatus,
  { label: string; cls: string }
> = {
  en_attente: { label: 'En attente', cls: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30' },
  entretien: { label: 'Entretien', cls: 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30' },
  accepte: { label: 'Accepté', cls: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' },
  refuse: { label: 'Refusé', cls: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30' },
}

export const STAFF_STATUS: Record<StaffStatus, { label: string; cls: string }> = {
  actif: { label: 'Actif', cls: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' },
  suspendu: { label: 'Suspendu', cls: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30' },
  parti: { label: 'Parti', cls: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30' },
  vire: { label: 'Viré', cls: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30' },
}

export const REVIEW_TYPE: Record<
  ReviewType,
  { label: string; cls: string; emoji: string }
> = {
  avertissement: { label: 'Avertissement', emoji: '⚠️', cls: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30' },
  up: { label: 'Montée (up)', emoji: '⬆️', cls: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' },
  down: { label: 'Descente (down)', emoji: '⬇️', cls: 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30' },
  vire: { label: 'Renvoi', emoji: '❌', cls: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30' },
  note: { label: 'Note', emoji: '📝', cls: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30' },
  reset_perm: { label: 'Reset perm', emoji: '🔄', cls: 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30' },
}

export const CATEGORY_LABEL: Record<string, string> = {
  fondation: 'Fondation / Co-Fondation',
  gestion: 'Hiérarchie Gestion',
  staff: 'Hiérarchie Staff',
}
