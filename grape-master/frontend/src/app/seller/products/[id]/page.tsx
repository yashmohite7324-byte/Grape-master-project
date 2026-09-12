'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/components/Toast'
import { Button, Card, Field, Input, Textarea, Select, Pill, Spinner } from '@/components/ui'
import { formatINR } from '@/lib/format'
import type { Product } from '@/lib/types'

const CATEGORIES = ['DAP', 'UREA', 'NPK', 'MOP', 'SSP', 'MICRONUTRIENT', 'PESTICIDE', 'HERBICIDE', 'FUNGICIDE', 'SEED', 'OTHER']
const UNITS = ['KG', 'BAG', 'LITER', 'PIECE', 'TON']

export default function SellerProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { show } = useToast()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', brand: '', category: '', description: '', unit: '', price: '', isActive: true })

  const { data, refetch } = useApi(
    () => api.get<Product>(`/seller/products/${id}`).then(r => r.data), [id]
  )

  useEffect(() => {
    if (data) setForm({
      name: data.name, brand: data.brand ?? '', category: data.category,
      description: data.description ?? '', unit: data.unit,
      price: String(data.price), isActive: data.isActive,
    })
  }, [data])

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.put(`/seller/products/${id}`, {
        name: form.name, brand: form.brand || undefined, category: form.category,
        description: form.description || undefined, unit: form.unit,
        price: Number(form.price), isActive: form.isActive,
      })
      show('success', 'Product updated'); setEditing(false); refetch()
    } catch (err) {
      show('error', err instanceof ApiError ? err.message : 'Update failed')
    } finally { setLoading(false) }
  }

  const toggleActive = async () => {
    try {
      await api.patch(`/seller/products/${id}/toggle`)
      show('success', data?.isActive ? 'Product deactivated' : 'Product activated'); refetch()
    } catch (err) { show('error', err instanceof ApiError ? err.message : 'Failed') }
  }

  if (!data) return <Spinner />

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/seller/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />Back to products
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{data.name}</h1>
          <p className="text-muted">{data.category} · {data.unit}</p>
        </div>
        <div className="flex gap-2">
          <Pill className={data.isActive ? 'bg-vine-soft text-vine-deep' : 'bg-line text-muted'}>
            {data.isActive ? 'Active' : 'Inactive'}
          </Pill>
          <Button variant="secondary" onClick={() => setEditing(e => !e)}>
            <Pencil className="h-4 w-4" />{editing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Inventory snapshot */}
      {data.inventory && (
        <Card className="mb-4 p-4">
          <p className="text-sm font-medium text-ink">Stock</p>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted">Total</p><p className="font-mono text-ink">{data.inventory.quantity} {data.unit}</p></div>
            <div><p className="text-muted">Reserved</p><p className="font-mono text-ink">{data.inventory.reservedQuantity} {data.unit}</p></div>
            <div><p className="text-muted">Available</p><p className="font-mono font-semibold text-vine">{data.inventory.availableQuantity} {data.unit}</p></div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        {editing ? (
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><Input required value={form.name} onChange={set('name')} /></Field>
              <Field label="Brand"><Input value={form.brand} onChange={set('brand')} /></Field>
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
            <Field label="Price (₹)"><Input type="number" min="1" step="any" required value={form.price} onChange={set('price')} /></Field>
            <Field label="Description"><Textarea value={form.description} onChange={set('description')} /></Field>
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>Save changes</Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <dl className="space-y-3 text-sm">
            {[
              ['Price', formatINR(data.price) + ' / ' + data.unit],
              ['Category', data.category],
              ['Brand', data.brand ?? '—'],
              ['Description', data.description ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted">{k}</dt>
                <dd className="font-mono text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>

      <div className="mt-4">
        <Button variant={data.isActive ? 'danger' : 'secondary'} onClick={toggleActive}>
          {data.isActive ? 'Deactivate product' : 'Activate product'}
        </Button>
      </div>
    </div>
  )
}
