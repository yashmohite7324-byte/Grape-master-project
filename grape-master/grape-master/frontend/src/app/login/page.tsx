'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Grape } from 'lucide-react'
import { useAuth, homeForRole } from '@/lib/auth-store'
import { ApiError } from '@/lib/api'
import { Button, Card, Field, Input } from '@/components/ui'

function LoginForm() {
  const { login, user, ready, hydrate } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) hydrate()
  }, [ready, hydrate])

  useEffect(() => {
    if (ready && user) router.replace(homeForRole(user.role))
  }, [ready, user, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const u = await login(email, password)
      router.replace(homeForRole(u.role))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <Grape className="h-7 w-7 text-grape" />
          <span className="font-display text-xl font-semibold text-ink">Grape Master</span>
        </Link>

        <Card className="p-8">
          <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your workspace.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@grapemaster.com"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            New here?{' '}
            <Link href="/register" className="font-medium text-vine hover:underline">
              Create an account
            </Link>
          </p>
        </Card>

        <p className="mt-4 text-center text-xs text-muted">
          Demo: farmer@grapemaster.com / broker@grapemaster.com — password{' '}
          <span className="font-mono">Password123</span>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
