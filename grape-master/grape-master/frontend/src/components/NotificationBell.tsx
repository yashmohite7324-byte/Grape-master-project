'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, Wifi, WifiOff } from 'lucide-react'
import { clsx } from 'clsx'
import { useWS } from '@/lib/ws-store'

const typeIcon: Record<string, string> = {
  OFFER:   '🤝',
  ORDER:   '📦',
  PAYMENT: '💳',
  ML:      '🤖',
  SYSTEM:  '⚙️',
}

export function NotificationBell() {
  const { connected, notifications, unreadCount, markRead, markAllRead, clearAll } = useWS()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-vine-soft transition-colors"
      >
        <Bell className="h-5 w-5 text-muted" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-line bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold text-ink">Notifications</span>
              <span className={clsx(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                connected ? 'bg-vine-soft text-vine-deep' : 'bg-line text-muted'
              )}>
                {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="rounded p-1 text-xs text-muted hover:text-vine">
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} title="Clear all"
                  className="rounded p-1 text-xs text-muted hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-muted" />
                <p className="mt-2 text-sm text-muted">No notifications yet</p>
                {!connected && <p className="mt-1 text-xs text-muted">Connecting to live feed…</p>}
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={clsx(
                    'w-full border-b border-line px-4 py-3 text-left transition-colors hover:bg-paper',
                    !n.read && 'bg-vine-soft/30'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-base">{typeIcon[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={clsx('text-sm', !n.read ? 'font-semibold text-ink' : 'text-ink')}>{n.title}</p>
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-vine" />}
                      </div>
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-muted">
                        {new Date(n.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
