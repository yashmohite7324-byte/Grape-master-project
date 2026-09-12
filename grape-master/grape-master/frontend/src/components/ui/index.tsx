'use client'

import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react'

// ── Button ──
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const styles = {
    primary: 'bg-vine text-white hover:bg-vine-deep',
    secondary: 'bg-white text-ink border border-line hover:border-vine',
    ghost: 'bg-transparent text-vine hover:bg-vine-soft',
    danger: 'bg-danger text-white hover:opacity-90',
  }[variant]

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium',
        'transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vine',
        'disabled:cursor-not-allowed disabled:opacity-60',
        styles,
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

// ── Card ──
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx('rounded-card border border-line bg-white shadow-card', className)}>
      {children}
    </div>
  )
}

// ── Field wrapper ──
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

const controlBase =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted ' +
  'focus:border-vine focus:outline-none focus:ring-2 focus:ring-vine/20'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(controlBase, props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(controlBase, 'min-h-[96px]', props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(controlBase, 'appearance-none', props.className)} />
}

// ── Pill / Badge ──
export function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        className
      )}
    >
      {children}
    </span>
  )
}

// ── Spinner ──
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

// ── Empty state ──
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
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-white/50 px-6 py-16 text-center">
      {icon && <div className="mb-3 text-vine">{icon}</div>}
      <p className="font-display text-lg text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ── Stat tile ──
export function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: ReactNode
  sub?: string
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </Card>
  )
}

// ── Money / quantity display (the "ledger" signature) ──
export function Money({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={clsx('font-mono tabular-nums', className)}>
      {new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(amount)}
    </span>
  )
}
