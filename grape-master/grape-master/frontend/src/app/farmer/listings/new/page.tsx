'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/Toast'
import { Button, Card, Field, Input, Textarea, Select } from '@/components/ui'
import type { Unit } from '@/lib/types'

const UNITS: Unit[] = ['KG', 'QUINTAL', 'TON', 'BAG', 'CRATE', 'DOZEN']

export default function NewListingPage() {
  const router = useRouter()
  const { show } = useToast()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    cropType: '',
    variety: '',
    quantity: '',
    unit: 'KG' as Unit,
    expectedPrice: '',
    harvestDate: '',
    description: '',
  })

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})
    try {
      await api.post('/farmer/listings', {
        cropType: form.cropType,
        variety: form.variety || undefined,
        quantity: Number(form.quantity),
        unit: form.unit,
        expectedPrice: Number(form.expectedPrice),
        harvestDate: form.harvestDate,
        description: form.description || undefined,
      })
      show('success', 'Listing created')
      router.push('/farmer/listings')
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors(Object.fromEntries(err.fields.map((f) => [f.field, f.message])))
      }
      show('error', err instanceof ApiError ? err.message : 'Could not create listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/farmer/listings" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">New listing</h1>

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Crop" error={fieldErrors.cropType}>
              <Input required value={form.cropType} onChange={set('cropType')} placeholder="Grapes" />
            </Field>
            <Field label="Variety" hint="Optional">
              <Input value={form.variety} onChange={set('variety')} placeholder="Thompson Seedless" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Quantity" error={fieldErrors.quantity}>
              <Input type="number" min="1" step="any" required value={form.quantity} onChange={set('quantity')} placeholder="500" />
            </Field>
            <Field label="Unit">
              <Select value={form.unit} onChange={set('unit')}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Price per unit (₹)" error={fieldErrors.expectedPrice}>
              <Input type="number" min="1" step="any" required value={form.expectedPrice} onChange={set('expectedPrice')} placeholder="80" />
            </Field>
          </div>

          <Field label="Harvest date" error={fieldErrors.harvestDate}>
            <Input type="date" required value={form.harvestDate} onChange={set('harvestDate')} />
          </Field>

          <Field label="Description" hint="Optional — quality, grade, pickup notes">
            <Textarea value={form.description} onChange={set('description')} placeholder="Export-grade, hand-picked…" />
          </Field>

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              Publish listing
            </Button>
            <Link href="/farmer/listings">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
