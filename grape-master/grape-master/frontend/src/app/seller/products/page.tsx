'use client'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Button, Card, Pill, Spinner, EmptyState } from '@/components/ui'
import { formatINR } from '@/lib/format'
import type { Product } from '@/lib/types'

export default function SellerProductsPage() {
  const { data, loading, error } = useApi(
    () => api.get<Product[]>('/seller/products', { limit: 100 }).then(r => r.data), []
  )
  const products = data ?? []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Products</h1>
        <Link href="/seller/products/new"><Button><Plus className="h-4 w-4" />Add product</Button></Link>
      </div>

      {loading ? <Spinner /> : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : products.length === 0 ? (
        <EmptyState icon={<Package className="h-8 w-8" />} title="No products yet"
          hint="Add fertilizers, seeds, or other agricultural inputs to start selling."
          action={<Link href="/seller/products/new"><Button>Add first product</Button></Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p => (
            <Link key={p.id} href={`/seller/products/${p.id}`}>
              <Card className="h-full p-5 transition-colors hover:border-vine">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg text-ink">{p.name}</p>
                    <p className="text-sm text-muted">{p.brand ? `${p.brand} · ` : ''}{p.category}</p>
                  </div>
                  <Pill className={p.isActive ? 'bg-vine-soft text-vine-deep' : 'bg-line text-muted'}>
                    {p.isActive ? 'Active' : 'Off'}
                  </Pill>
                </div>
                {p.description && <p className="mb-3 line-clamp-2 text-sm text-muted">{p.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-semibold text-ink">{formatINR(p.price)}</span>
                  <span className="text-sm text-muted">per {p.unit}</span>
                </div>
                {p.inventory && (
                  <p className="mt-2 text-xs text-muted">
                    Stock: <span className="font-mono text-ink">{p.inventory.availableQuantity} {p.unit}</span>
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
