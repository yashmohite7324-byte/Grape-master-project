'use client'
import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Grape, LogOut, User } from 'lucide-react'
import { useAuth, homeForRole } from '@/lib/auth-store'
import { Spinner } from '@/components/ui'
import { NotificationBell } from '@/components/NotificationBell'
import type { Role } from '@/lib/types'
import { ThemeToggleBtn } from '@/components/ThemeToggle'

export interface NavItem { href: string; label: string; icon: ReactNode }

export function DashboardShell({ role, nav, children }: { role: Role; nav: NavItem[]; children: ReactNode }) {
  const { user, ready, hydrate, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { if (!ready) hydrate() }, [ready, hydrate])
  useEffect(() => {
    if (ready && !user) router.replace('/login')
    else if (ready && user && user.role !== role && user.role !== 'ADMIN') router.replace(homeForRole(user.role))
  }, [ready, user, role, router])

  if (!ready || !user || (user.role !== role && user.role !== 'ADMIN')) {
    return <div className="flex min-h-screen items-center justify-center bg-paper"><Spinner label="Loading…" /></div>
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href || (item.href !== '/' + role && pathname.startsWith(item.href + '/'))
    return (
      <Link href={item.href}
        className={clsx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active ? 'bg-vine-soft text-vine-deep' : 'text-muted hover:bg-vine-soft/50 hover:text-ink')}>
        {item.icon}{item.label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
          <Link href={homeForRole(role)} className="mb-8 flex items-center gap-2 px-2">
            <Grape className="h-6 w-6 text-grape" />
            <span className="font-display text-lg font-semibold text-ink">Grape Master</span>
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {nav.map(item => <NavLink key={item.href} item={item} />)}
          </nav>
          <div className="space-y-1">
              <div className="px-2 py-1"><ThemeToggleBtn /></div>
              <NotificationBell />
              <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-vine-soft/50 hover:text-ink">
                <User className="h-4 w-4" />Profile
              </Link>
              <button onClick={() => { logout(); router.replace('/login') }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-danger">
                <LogOut className="h-4 w-4" />Sign out
              </button>
            </div>
        </aside>

        <div className="flex-1 overflow-x-hidden">
          {/* Mobile header */}
          <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
            <Link href={homeForRole(role)} className="flex items-center gap-2">
              <Grape className="h-5 w-5 text-grape" />
              <span className="font-display font-semibold text-ink">Grape Master</span>
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button onClick={() => { logout(); router.replace('/login') }} className="text-muted hover:text-danger">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* Mobile tab bar */}
          <div className="flex gap-1 overflow-x-auto border-b border-line px-2 py-2 md:hidden">
            {nav.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href}
                  className={clsx('whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium',
                    active ? 'bg-vine-soft text-vine-deep' : 'text-muted')}>
                  {item.label}
                </Link>
              )
            })}
          </div>

          <main className="px-4 py-6 md:px-8 md:py-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 border border-line shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-bold text-ink">
                  {user.fullName ?? user.email} <span className="text-muted font-normal">({user.role.replace('_', ' ')})</span>
                </p>
              </div>

              {/* Portal Quick Switcher (Farmer, Broker, Fertilizer Seller, Customer, Admin) */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <span className="text-[11px] text-muted mr-1">Role Portals:</span>
                <Link href="/farmer" className={`px-2.5 py-1 rounded-lg transition ${pathname.startsWith('/farmer') ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-paper text-slate-600 hover:bg-emerald-50'}`}>🌾 Farmer</Link>
                <Link href="/broker" className={`px-2.5 py-1 rounded-lg transition ${pathname.startsWith('/broker') ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-paper text-slate-600 hover:bg-amber-50'}`}>🤝 Broker</Link>
                <Link href="/seller" className={`px-2.5 py-1 rounded-lg transition ${pathname.startsWith('/seller') ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-paper text-slate-600 hover:bg-blue-50'}`}>🧪 Fertilizer Seller</Link>
                <Link href="/customer" className={`px-2.5 py-1 rounded-lg transition ${pathname.startsWith('/customer') ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-paper text-slate-600 hover:bg-purple-50'}`}>🛒 Customer</Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className={`px-2.5 py-1 rounded-lg transition ${pathname.startsWith('/admin') ? 'bg-slate-900 text-emerald-400 font-bold' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>🛡️ Admin</Link>
                )}
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
