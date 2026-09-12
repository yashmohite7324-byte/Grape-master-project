'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { CheckCircle2, XCircle, X } from 'lucide-react'

type ToastKind = 'success' | 'error'
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

const ToastCtx = createContext<{ show: (kind: ToastKind, message: string) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-card',
              t.kind === 'success' ? 'border-vine/30' : 'border-danger/30'
            )}
          >
            {t.kind === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-vine" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            )}
            <p className="flex-1 text-sm text-ink">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
