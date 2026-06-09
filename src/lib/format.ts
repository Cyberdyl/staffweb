import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function fmtDate(d: string | Date): string {
  return format(new Date(d), 'dd/MM/yyyy', { locale: fr })
}

export function fmtDateTime(d: string | Date): string {
  return format(new Date(d), "dd/MM/yyyy 'à' HH'h'mm", { locale: fr })
}

export function fmtTime(d: string | Date): string {
  return format(new Date(d), "HH'h'mm", { locale: fr })
}

export function fmtRelative(d: string | Date): string {
  return formatDistanceToNow(new Date(d), { locale: fr, addSuffix: true })
}

export function fmtSmartDay(d: string | Date): string {
  const date = new Date(d)
  if (isToday(date)) return "Aujourd'hui"
  if (isTomorrow(date)) return 'Demain'
  return format(date, 'EEEE d MMMM', { locale: fr })
}

// Génère les initiales d'un pseudo pour les avatars de secours.
export function initials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
