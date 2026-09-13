'use client'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Button, Card, Pill, Spinner, EmptyState } from '@/components/ui'
import { formatINR } from '@/lib/format'
import { getProductImage } from '@/lib/images'
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
          {products.map(p => {
            const imgUrl = getProductImage(p.name + ' ' + p.category, p.id, '400x250', p.images?.[0])
            const inv = Array.isArray(p.inventory) ? p.inventory[0] : (p.inventory as any)
            const stockQty = inv?.availableQuantity ?? 0
            return (
              <Link key={p.id} href={`/seller/products/${p.id}`}>
                <Card className="h-full overflow-hidden p-0 transition-colors hover:border-vine flex flex-col justify-between">
                  <div>
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      <img src={imgUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                      <div className="absolute top-3 right-3">
                        <Pill className={p.isActive ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-700 text-white'}>
                          {p.isActive ? 'Active' : 'Off'}
                        </Pill>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-2">
                        <p className="font-display text-lg font-bold text-ink leading-tight">{p.name}</p>
                        <p className="text-xs font-semibold text-emerald-700">{p.brand ? `${p.brand} · ` : ''}{p.category}</p>
                      </div>
                      {p.description && <p className="mb-3 line-clamp-2 text-xs text-muted leading-relaxed">{p.description}</p>}
                    </div>
                  </div>
                  <div className="p-4 pt-0 border-t border-slate-100 mt-auto">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-bold text-ink">{formatINR(p.price)}</span>
                      <span className="text-xs text-muted">per {p.unit}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Stock:</span>
                      <span className={`font-mono font-bold ${stockQty <= 10 ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {stockQty} {p.unit}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
