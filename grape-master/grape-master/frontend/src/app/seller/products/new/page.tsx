'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/Toast'
import { Button, Card, Field, Input, Textarea, Select } from '@/components/ui'

const CATEGORIES = ['DAP', 'UREA', 'NPK', 'MOP', 'SSP', 'MICRONUTRIENT', 'PESTICIDE', 'HERBICIDE', 'FUNGICIDE', 'SEED', 'OTHER']
const UNITS = ['KG', 'BAG', 'LITER', 'PIECE', 'TON']

export default function NewProductPage() {
  const router = useRouter()
  const { show } = useToast()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '', brand: '', category: 'DAP', description: '',
    unit: 'BAG', price: '', initialStock: '',
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setFieldErrors({})
    try {
      await api.post('/seller/products', {
        name: form.name, brand: form.brand || undefined, category: form.category,
        description: form.description || undefined, unit: form.unit,
        price: Number(form.price), initialStock: Number(form.initialStock) || 0,
      })
      show('success', 'Product added')
      router.push('/seller/products')
    } catch (err) {
      if (err instanceof ApiError && err.fields)
        setFieldErrors(Object.fromEntries(err.fields.map(f => [f.field, f.message])))
      show('error', err instanceof ApiError ? err.message : 'Could not add product')
    } finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/seller/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />Back to products
      </Link>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Add product</h1>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" error={fieldErrors.name}>
              <Input required value={form.name} onChange={set('name')} placeholder="DAP Fertilizer" />
            </Field>
            <Field label="Brand" hint="Optional">
              <Input value={form.brand} onChange={set('brand')} placeholder="IFFCO" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Unit">
              <Select value={form.unit} onChange={set('unit')}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price per unit (₹)" error={fieldErrors.price}>
              <Input type="number" min="1" step="any" required value={form.price} onChange={set('price')} placeholder="1350" />
            </Field>
            <Field label="Initial stock" hint="Bags / KG / Liters available">
              <Input type="number" min="0" step="any" value={form.initialStock} onChange={set('initialStock')} placeholder="100" />
            </Field>
          </div>
          <Field label="Description" hint="Optional">
            <Textarea value={form.description} onChange={set('description')} placeholder="Grade, composition, usage instructions…" />
          </Field>
          <div className="flex gap-3">
            <Button type="submit" loading={loading}>Add product</Button>
            <Link href="/seller/products"><Button type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
