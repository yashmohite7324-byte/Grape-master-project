'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, Grape } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useCart } from '@/lib/cart-store'
import { useToast } from '@/components/Toast'
import { Button, Card, Field, Input, Select, Spinner, EmptyState, Pill } from '@/components/ui'
import { formatINR } from '@/lib/format'
import { getProductImage, getCropImage } from '@/lib/images'
import type { Product } from '@/lib/types'

const CATEGORIES = ['ALL','DAP','UREA','NPK','MOP','PESTICIDE','SEED','OTHER']

export default function CustomerBrowsePage() {
  const { show } = useToast()
  const { add, items } = useCart()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [applied, setApplied] = useState({ search: '', category: 'ALL' })

  const { data, loading } = useApi(
    () => api.get<Product[]>('/products', {
      search: applied.search || undefined,
      category: applied.category === 'ALL' ? undefined : applied.category,
      limit: 60,
    }).then(r => r.data), [applied]
  )

  const cartCount = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Browse Products</h1>
        <Link href="/customer/cart">
          <Button variant="secondary">
            <ShoppingCart className="h-4 w-4" />Cart
            {cartCount > 0 && <span className="ml-1 rounded-full bg-vine px-1.5 py-0.5 text-xs text-white">{cartCount}</span>}
          </Button>
        </Link>
      </div>

      {/* Hero banner */}
      <div className="relative mb-6 h-36 overflow-hidden rounded-2xl">
        <img src="https://source.unsplash.com/1200x300/?fresh,market,vegetables" alt="Fresh market" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Fresh agricultural products</h2>
            <p className="text-sm text-white/80">Quality inputs from verified sellers</p>
          </div>
        </div>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" />
          </div>
          <div className="w-44">
            <Select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All categories' : c}</option>)}
            </Select>
          </div>
          <Button onClick={() => setApplied({ search, category })}>
            <Search className="h-4 w-4" />Search
          </Button>
        </div>
      </Card>

      {loading ? <Spinner /> : (data ?? []).length === 0 ? (
        <EmptyState icon={<Search className="h-8 w-8" />} title="No products found" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data ?? []).map((p: Product) => {
            const inCart = items.find(i => i.product.id === p.id)
            return (
              <Card key={p.id} className="overflow-hidden card-hover flex flex-col">
                <div className="relative h-40 overflow-hidden">
                  <img src={getProductImage(p.category, p.id, '300x200')} alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                  <div className="absolute top-2 left-2">
                    <Pill className="bg-white/90 text-vine-deep shadow text-xs">{p.category}</Pill>
                  </div>
                </div>
                <div className="flex flex-col flex-1 p-4">
                  <p className="font-display font-semibold text-ink">{p.name}</p>
                  {p.brand && <p className="text-xs text-muted">{p.brand}</p>}
                  {p.description && <p className="mt-1 flex-1 text-xs text-muted line-clamp-2">{p.description}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-xl font-bold text-vine">{formatINR(p.price)}</span>
                    <span className="text-xs text-muted">/{p.unit}</span>
                  </div>
                  {p.inventory && (
                    <p className="mb-3 text-xs text-muted">
                      <span className="font-mono text-ink">{p.inventory.availableQuantity}</span> {p.unit} in stock
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Link href={`/customer/browse/${p.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full text-xs h-9">Details</Button>
                    </Link>
                    <Button
                      className="flex-1 text-xs h-9"
                      variant={inCart ? 'secondary' : 'primary'}
                      onClick={() => { add(p, 1); show('success', `${p.name} added to cart`) }}
                    >
                      {inCart ? 'In cart' : 'Add to cart'}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
