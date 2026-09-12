'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, homeForRole } from '@/lib/auth-store'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/Toast'
import { Button, Card, Field, Input, Spinner } from '@/components/ui'

export default function ProfilePage() {
  const { user, hydrate, ready } = useAuth()
  const { show } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ fullName: '', mobileNumber: '', village: '', district: '', state: '', pincode: '' })

  useEffect(() => { if (!ready) hydrate() }, [ready, hydrate])
  useEffect(() => {
    if (ready && !user) router.replace('/login')
  }, [ready, user, router])

  useEffect(() => {
    if (user) {
      api.get<any>('/auth/me').then(r => {
        const p = r.data.profile ?? {}
        setForm({ fullName: p.fullName ?? '', mobileNumber: p.mobileNumber ?? '', village: p.village ?? '', district: p.district ?? '', state: p.state ?? '', pincode: p.pincode ?? '' })
      })
    }
  }, [user])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.patch('/auth/profile', form)
      show('success', 'Profile updated')
    } catch (err) {
      show('error', err instanceof ApiError ? err.message : 'Update failed')
    } finally { setLoading(false) }
  }

  if (!ready || !user) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-lg">
        <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Your profile</h1>
        <Card className="p-6">
          <form onSubmit={save} className="space-y-4">
            <Field label="Full name"><Input required value={form.fullName} onChange={set('fullName')} /></Field>
            <Field label="Mobile number"><Input required value={form.mobileNumber} onChange={set('mobileNumber')} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Village"><Input value={form.village} onChange={set('village')} /></Field>
              <Field label="District"><Input value={form.district} onChange={set('district')} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="State"><Input value={form.state} onChange={set('state')} /></Field>
              <Field label="PIN code"><Input value={form.pincode} onChange={set('pincode')} /></Field>
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>Save changes</Button>
              <Button type="button" variant="secondary" onClick={() => router.push(homeForRole(user.role))}>
                Back to dashboard
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
