'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Lock, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-store'
import { ApiError } from '@/lib/api'
import { Card, Button, Input } from '@/components/ui'

export default function AdminLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('admin@grapemaster.com')
  const [password, setPassword] = useState('Password123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const user = await login(email, password)
      if (user.role !== 'ADMIN') {
        setError('This account does not have System Admin privileges.')
        return
      }
      router.push('/admin')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid Admin credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      {/* Admin Branding Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 to-emerald-800 text-white shadow-xl">
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900">System Admin Sign-In</h1>
        <p className="mt-1 text-xs text-slate-500">
          Single Authenticated Admin Control Panel — Grape Master Marketplace
        </p>
      </div>

      <Card className="p-6 border-slate-200 shadow-2xl bg-white">
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-950">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Master Admin Security Policy
          </div>
          Exactly one master administrator account exists (<code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">admin@grapemaster.com</code>). Public signup for admin role is disabled.
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email Address</label>
            <div className="relative">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@grapemaster.com"
                className="pl-9"
              />
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Security Password</label>
            <div className="relative">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
              />
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

          <Button type="submit" loading={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3">
            Authenticate & Access Admin Console
          </Button>
        </form>
      </Card>

      {/* 4 Role Portal Quick Access links */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">Role Portals Quick Access</span>
        <div className="grid grid-cols-2 gap-2 text-xs font-medium">
          <Link href="/farmer" className="p-2 rounded-lg bg-white border border-slate-200 text-emerald-800 hover:bg-emerald-50">🌾 Farmer Portal</Link>
          <Link href="/broker" className="p-2 rounded-lg bg-white border border-slate-200 text-amber-800 hover:bg-amber-50">🤝 Broker Portal</Link>
          <Link href="/seller" className="p-2 rounded-lg bg-white border border-slate-200 text-blue-800 hover:bg-blue-50">🧪 Fertilizer Seller</Link>
          <Link href="/customer" className="p-2 rounded-lg bg-white border border-slate-200 text-purple-800 hover:bg-purple-50">🛒 Customer Portal</Link>
        </div>
      </div>
    </div>
  )
}
