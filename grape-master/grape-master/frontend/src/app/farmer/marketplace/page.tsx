'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useCart } from '@/lib/cart-store'
import { useToast } from '@/components/Toast'
import { Button, Card, Field, Input, Select, Spinner, EmptyState, Pill } from '@/components/ui'
import { formatINR } from '@/lib/format'
import { getProductImage } from '@/lib/images'
import type { Product } from '@/lib/types'

const CATEGORIES = ['ALL','DAP','UREA','NPK','MOP','SSP','MICRONUTRIENT','PESTICIDE','HERBICIDE','FUNGICIDE','SEED','OTHER']

export default function FarmerMarketplacePage() {
  const { show } = useToast()
  const { add, items: cartItems } = useCart()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [applied, setApplied] = useState({ search: '', category: 'ALL' })

  const { data, loading } = useApi(
    () => api.get<any[]>('/recommendations', { limit: 8 }).then(r => r.data), []
  )
  const products = useApi(
    () => api.get<Product[]>('/products', {
      search: applied.search || undefined,
      category: applied.category === 'ALL' ? undefined : applied.category,
      limit: 50,
    }).then(r => r.data), [applied]
  )

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Fertilizer Marketplace</h1>
        <Link href="/farmer/cart">
          <Button variant="secondary">
            <ShoppingCart className="h-4 w-4" />Cart
            {cartCount > 0 && <span className="ml-1 rounded-full bg-vine px-1.5 py-0.5 text-xs text-white">{cartCount}</span>}
          </Button>
        </Link>
      </div>

      {/* AI Recommendations strip */}
      {(data ?? []).length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-grape" />
            <span className="text-sm font-semibold text-ink">Recommended for your crop</span>
            <span className="rounded-full bg-grape-soft px-2 py-0.5 text-xs text-grape">AI</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(data ?? []).slice(0, 6).map((rec: any) => (
              <div key={rec.product_id} className="w-36 shrink-0 overflow-hidden rounded-card border border-grape/30 bg-grape-soft/30">
                <div className="h-20 overflow-hidden">
                  <img src={getProductImage(rec.category ?? rec.product?.category ?? 'OTHER', rec.product_id, '144x80')} alt={rec.product_name} className="h-full w-full object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-ink line-clamp-1">{rec.product_name}</p>
                  <p className="text-xs text-grape">{Math.round(rec.score * 100)}% match</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fertilizers…" />
          </div>
          <div className="w-40">
            <Select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All categories' : c}</option>)}
            </Select>
          </div>
          <Button onClick={() => setApplied({ search, category })}>
            <Search className="h-4 w-4" />Search
          </Button>
        </div>
      </Card>

      {products.loading ? <Spinner /> : (products.data ?? []).length === 0 ? (
        <EmptyState icon={<Search className="h-8 w-8" />} title="No products found" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(products.data ?? []).map((p: Product) => {
            const inCart = cartItems.find(i => i.product.id === p.id)
            return (
              <Card key={p.id} className="overflow-hidden card-hover">
                <div className="h-36 overflow-hidden">
                  <img src={getProductImage(p.category, p.id, '300x200')} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                </div>
                <div className="p-4">
                  <div className="mb-1 flex items-start justify-between">
                    <p className="font-display font-semibold text-ink">{p.name}</p>
                    <Pill className="bg-vine-soft text-vine-deep text-xs ml-1 shrink-0">{p.unit}</Pill>
                  </div>
                  {p.brand && <p className="text-xs text-muted">{p.brand}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-vine">{formatINR(p.price)}</span>
                  </div>
                  {p.inventory && (
                    <p className="mb-3 text-xs text-muted">
                      <span className="font-mono text-ink">{p.inventory.availableQuantity}</span> {p.unit} available
                    </p>
                  )}
                  <Button
                    className="w-full text-sm"
                    variant={inCart ? 'secondary' : 'primary'}
                    onClick={() => { add(p, 1); show('success', `${p.name} added to cart`) }}
                  >
                    {inCart ? `In cart (${inCart.quantity})` : 'Add to cart'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
