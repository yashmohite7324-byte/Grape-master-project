'use client'
import { useState, useRef, useEffect } from 'react'
import { Bell, Wifi, WifiOff, CheckCheck, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useNotifications, type Notification } from '@/hooks/useNotifications'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const typeColor: Record<string, string> = {
  OFFER: 'bg-harvest-soft text-harvest',
  ORDER: 'bg-vine-soft text-vine',
  PAYMENT: 'bg-green-50 text-green-700',
  SYSTEM: 'bg-slate-100 text-slate-600',
}

export function NotificationBell() {
  const { notifications, unreadCount, isOnline, markAllRead, requestPushPermission } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    requestPushPermission()
  }, [requestPushPermission])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-muted shadow-sm hover:text-ink transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-vine text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-ink">Notifications</h3>
              <span className={clsx('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                {isOnline ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                {isOnline ? 'Live' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:text-vine" title="Mark all read">
                  <CheckCheck className="h-3 w-3" />Mark read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted hover:text-ink">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-8 w-8 text-muted/40" />
                <p className="mt-3 text-sm text-muted">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n: Notification) => (
                <div
                  key={n.id ?? n.createdAt}
                  className={clsx('border-b border-line px-4 py-3 transition-colors', !n.isRead && 'bg-vine-soft/30')}
                >
                  <div className="flex items-start gap-3">
                    <span className={clsx('mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide', typeColor[n.type] ?? typeColor.SYSTEM)}>
                      {n.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-muted/60">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-vine" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
