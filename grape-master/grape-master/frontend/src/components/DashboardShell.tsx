'use client'
import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Grape, LogOut, User } from 'lucide-react'
import { useAuth, homeForRole } from '@/lib/auth-store'
import { useWS } from '@/lib/ws-store'
import { Spinner } from '@/components/ui'
import { NotificationBell } from '@/components/NotificationBell'
import type { Role } from '@/lib/types'

export interface NavItem { href: string; label: string; icon: ReactNode; badge?: number }

export function DashboardShell({ role, nav, children }: {
  role: Role; nav: NavItem[]; children: ReactNode
}) {
  const { user, ready, hydrate, logout } = useAuth()
  const { connect, disconnect } = useWS()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { if (!ready) hydrate() }, [ready, hydrate])

  useEffect(() => {
    if (ready && !user) router.replace('/login')
    else if (ready && user && user.role !== role) router.replace(homeForRole(user.role))
  }, [ready, user, role, router])

  // Connect WebSocket once authenticated
  useEffect(() => {
    if (ready && user) {
      connect()
      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
    return () => { /* keep connection alive across pages */ }
  }, [ready, user, connect])

  if (!ready || !user || user.role !== role) {
    return <div className="flex min-h-screen items-center justify-center bg-paper"><Spinner label="Loading…" /></div>
  }

  const handleLogout = () => {
    disconnect()
    logout()
    router.replace('/login')
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href || (item.href.length > 6 && pathname.startsWith(item.href + '/'))
    return (
      <Link href={item.href}
        className={clsx(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
          active ? 'bg-vine text-white shadow-sm' : 'text-muted hover:bg-vine-soft hover:text-ink'
        )}>
        {item.icon}{item.label}
        {item.badge && item.badge > 0 && (
          <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] text-white">{item.badge}</span>
        )}
      </Link>
    )
  }

  const roleColor: Record<string, string> = {
    FARMER: 'from-vine-deep to-vine', BROKER: 'from-[#3d1528] to-grape',
    FERTILIZER_SELLER: 'from-[#7c4d0f] to-harvest', CUSTOMER: 'from-ink to-ink/80', ADMIN: 'from-ink to-ink/80'
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex max-w-7xl">
        {/* Desktop Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white md:flex">
          {/* Brand */}
          <div className={`bg-gradient-to-br ${roleColor[role] ?? 'from-vine to-vine-deep'} p-5`}>
            <Link href={homeForRole(role)} className="flex items-center gap-2.5">
              <Grape className="h-6 w-6 text-white" />
              <span className="font-display text-lg font-bold text-white">Grape Master</span>
            </Link>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {user.fullName?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user.fullName}</p>
                <p className="text-xs text-white/60">{role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {nav.map(item => <NavLink key={item.href} item={item} />)}
          </nav>

          {/* Footer */}
          <div className="border-t border-line px-3 py-3 space-y-1">
            <Link href="/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-vine-soft hover:text-ink">
              <User className="h-4 w-4" />Profile
            </Link>
            <button onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:text-danger">
              <LogOut className="h-4 w-4" />Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 overflow-x-hidden">
          {/* Topbar */}
          <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 backdrop-blur-sm px-4 py-3 md:px-6">
            {/* Mobile brand */}
            <Link href={homeForRole(role)} className="flex items-center gap-2 md:hidden">
              <Grape className="h-5 w-5 text-grape" />
              <span className="font-display font-semibold text-ink">Grape Master</span>
            </Link>
            {/* Breadcrumb on desktop */}
            <div className="hidden md:block text-sm text-muted">
              {nav.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.label ?? ''}
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <button onClick={handleLogout} className="md:hidden text-muted hover:text-danger">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-line px-2 py-2 md:hidden bg-white">
            {nav.slice(0, 5).map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href}
                  className={clsx('flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs',
                    active ? 'bg-vine text-white' : 'text-muted')}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          <main className="px-4 py-6 md:px-6 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
