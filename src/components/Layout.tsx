import { useState, type ReactNode } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  Home,
  Send,
  UserCircle,
  Inbox,
  CalendarDays,
  Users,
  ClipboardList,
  Network,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { SERVER_NAME } from '../lib/config'
import { Avatar, Logo } from './ui'
import { RealtimeNotifications } from './RealtimeNotifications'

const ROLE_LABEL: Record<string, string> = {
  applicant: 'Candidat',
  manager: 'Gérant staff',
  owner: 'Propriétaire',
}

function NavItem({
  to,
  icon,
  label,
  onClick,
  end,
}: {
  to: string
  icon: ReactNode
  label: string
  onClick?: () => void
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-brand-600/15 text-brand-200 ring-1 ring-brand-500/30'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`
      }
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </NavLink>
  )
}

function NavGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { session, profile, isManager, isOwner, signInDiscord, signOut } =
    useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link
        to="/"
        onClick={close}
        className="flex items-center gap-2.5 px-2 py-1"
      >
        <Logo size={38} withGlow />
        <span className="font-display text-lg font-bold leading-none text-white">
          {SERVER_NAME}
          <span className="block text-[11px] font-medium text-slate-500">
            Recrutement staff
          </span>
        </span>
      </Link>

      <nav className="mt-3 flex-1 overflow-y-auto pr-1">
        <NavGroup title="Candidat">
          <NavItem to="/" end icon={<Home className="h-4.5 w-4.5" />} label="Accueil" onClick={close} />
          <NavItem to="/postuler" icon={<Send className="h-4.5 w-4.5" />} label="Postuler" onClick={close} />
          {session && (
            <NavItem
              to="/ma-candidature"
              icon={<UserCircle className="h-4.5 w-4.5" />}
              label="Ma candidature"
              onClick={close}
            />
          )}
        </NavGroup>

        {isManager && (
          <NavGroup title="Staff">
            <NavItem to="/admin" end icon={<Inbox className="h-4.5 w-4.5" />} label="Candidatures" onClick={close} />
            <NavItem to="/admin/calendrier" icon={<CalendarDays className="h-4.5 w-4.5" />} label="Calendrier" onClick={close} />
            <NavItem to="/admin/effectif" icon={<Users className="h-4.5 w-4.5" />} label="Effectif staff" onClick={close} />
            <NavItem to="/admin/reunion" icon={<ClipboardList className="h-4.5 w-4.5" />} label="Réunion" onClick={close} />
            <NavItem to="/admin/hierarchie" icon={<Network className="h-4.5 w-4.5" />} label="Hiérarchie" onClick={close} />
          </NavGroup>
        )}

        {isOwner && (
          <NavGroup title="Direction">
            <NavItem to="/admin/gerants" icon={<ShieldCheck className="h-4.5 w-4.5" />} label="Gérants" onClick={close} />
          </NavGroup>
        )}
      </nav>

      <div className="mt-3 border-t border-white/5 pt-3">
        {session ? (
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
            <Avatar src={profile?.avatar_url} name={profile?.username} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {profile?.username ?? 'Utilisateur'}
              </p>
              <p className="text-xs text-brand-300">
                {ROLE_LABEL[profile?.role ?? 'applicant']}
              </p>
            </div>
            <button
              onClick={signOut}
              title="Se déconnecter"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-rose-300"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          <button onClick={signInDiscord} className="btn-primary w-full">
            <DiscordGlyph /> Se connecter avec Discord
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      {/* Notifications temps réel (gérants connectés uniquement) */}
      {isManager && <RealtimeNotifications />}

      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/5 bg-night-900/60 p-4 backdrop-blur lg:block">
        {sidebar}
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-night-900/80 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-display font-bold text-white">{SERVER_NAME}</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/5"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-night-900 p-4">
            <button
              onClick={close}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

function DiscordGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M20.317 4.369a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.036A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.2 14.2 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  )
}
