'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useCart } from '@/lib/cart-store'
import { useToast } from '@/components/Toast'
import { Button, Card, Spinner, Field, Input } from '@/components/ui'
import { formatINR } from '@/lib/format'
import type { Product } from '@/lib/types'

export default function CustomerProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { add } = useCart()
  const { show } = useToast()
  const [qty, setQty] = useState(1)

  const { data, loading } = useApi(
    () => api.get<Product>(`/products/${id}`).then(r => r.data), [id]
  )

  if (loading || !data) return <Spinner />

  const addToCart = () => {
    add(data, qty)
    show('success', `${qty} × ${data.name} added to cart`)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/customer" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />Browse products
      </Link>

      <Card className="p-6">
        <h1 className="font-display text-3xl font-semibold text-ink">{data.name}</h1>
        {data.brand && <p className="mt-0.5 text-muted">{data.brand}</p>}

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <Meta label="Category" value={data.category} />
          <Meta label="Unit" value={data.unit} />
          <Meta label="Price" value={formatINR(data.price)} />
          <Meta label="Available" value={`${data.inventory?.availableQuantity ?? 0} ${data.unit}`} />
        </div>

        {data.description && (
          <p className="mt-5 rounded-lg bg-paper px-4 py-3 text-sm text-ink">{data.description}</p>
        )}

        <div className="mt-6 flex items-end gap-4">
          <Field label="Quantity">
            <Input type="number" min="1" max={data.inventory?.availableQuantity ?? 999}
              value={qty} onChange={e => setQty(Number(e.target.value))} className="w-28" />
          </Field>
          <div>
            <p className="mb-2 text-sm text-muted">Total: <span className="font-mono font-semibold text-ink">{formatINR(qty * data.price)}</span></p>
            <Button onClick={addToCart}>
              <ShoppingCart className="h-4 w-4" />Add {qty} to cart
            </Button>
          </div>
        </div>

        {data.seller?.profile && (
          <p className="mt-4 text-xs text-muted">
            Sold by {data.seller.sellerProfile?.sellerName ?? data.seller.profile.fullName}
            {data.seller.profile.district ? ` · ${data.seller.profile.district}` : ''}
          </p>
        )}
      </Card>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 font-mono tabular-nums text-ink">{value}</dd>
    </div>
  )
}
