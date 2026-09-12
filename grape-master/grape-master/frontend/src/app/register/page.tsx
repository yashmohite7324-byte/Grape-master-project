'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Grape, Sprout, Store, ShoppingBag, Leaf } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth, homeForRole } from '@/lib/auth-store'
import { ApiError } from '@/lib/api'
import { Button, Card, Field, Input } from '@/components/ui'
import type { Role } from '@/lib/types'

const ROLES: { value: Role; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: 'FARMER', label: 'Farmer', icon: <Sprout className="h-5 w-5" />, hint: 'List produce, buy inputs' },
  { value: 'BROKER', label: 'Broker', icon: <Store className="h-5 w-5" />, hint: 'Buy and resell produce' },
  { value: 'FERTILIZER_SELLER', label: 'Seller', icon: <Leaf className="h-5 w-5" />, hint: 'Sell fertilizers & inputs' },
  { value: 'CUSTOMER', label: 'Customer', icon: <ShoppingBag className="h-5 w-5" />, hint: 'Buy agricultural products' },
]

function RegisterForm() {
  const { register } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const initRole = (params.get('role') as Role) || 'FARMER'
  const [role, setRole] = useState<Role>(initRole)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', mobileNumber: '', village: '', district: '', state: '', primaryCrop: '', companyName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (ROLES.find(r => r.value === initRole)) setRole(initRole) }, [initRole])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const u = await register({
        role, fullName: form.fullName, email: form.email, password: form.password,
        mobileNumber: form.mobileNumber, village: form.village || undefined,
        district: form.district || undefined, state: form.state || undefined,
        primaryCrop: role === 'FARMER' ? form.primaryCrop : undefined,
        companyName: (role === 'BROKER' || role === 'FERTILIZER_SELLER') ? form.companyName : undefined,
      })
      router.replace(homeForRole(u.role))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create account')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <Grape className="h-7 w-7 text-grape" />
          <span className="font-display text-xl font-semibold text-ink">Grape Master</span>
        </Link>
        <Card className="p-8">
          <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Join the agricultural marketplace.</p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ROLES.map(r => (
              <button key={r.value} type="button" onClick={() => setRole(r.value)}
                className={clsx('flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors',
                  role === r.value ? 'border-vine bg-vine-soft text-vine-deep' : 'border-line text-muted hover:border-vine/50')}>
                {r.icon}<span>{r.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{ROLES.find(r => r.value === role)?.hint}</p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Full name"><Input required value={form.fullName} onChange={set('fullName')} placeholder="Ravi Patil" /></Field>
            <Field label="Email"><Input type="email" required value={form.email} onChange={set('email')} /></Field>
            <Field label="Password" hint="At least 8 characters"><Input type="password" required minLength={8} value={form.password} onChange={set('password')} /></Field>
            <Field label="Mobile number"><Input required value={form.mobileNumber} onChange={set('mobileNumber')} placeholder="9876543210" /></Field>

            {role === 'FARMER' && (
              <Field label="Primary crop"><Input required value={form.primaryCrop} onChange={set('primaryCrop')} placeholder="Grapes" /></Field>
            )}
            {(role === 'BROKER' || role === 'FERTILIZER_SELLER') && (
              <Field label="Company name" hint="Optional"><Input value={form.companyName} onChange={set('companyName')} placeholder="ABC Traders" /></Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="District"><Input value={form.district} onChange={set('district')} placeholder="Nashik" /></Field>
              <Field label="State"><Input value={form.state} onChange={set('state')} placeholder="Maharashtra" /></Field>
            </div>

            {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">Create account</Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-vine hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
