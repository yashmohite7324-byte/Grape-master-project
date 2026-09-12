'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, Sprout, Filter } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useCart } from '@/lib/cart-store'
import { useToast } from '@/components/Toast'
import { Button, Card, Input, Select, Spinner, EmptyState, Pill } from '@/components/ui'
import { formatINR, formatQty } from '@/lib/format'
import { getCropImage } from '@/lib/images'

const CROP_CATEGORIES = ['ALL', 'Grapes', 'Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Dairy', 'Organic']

export default function CustomerBrowsePage() {
  const { show } = useToast()
  const { add, items } = useCart()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [applied, setApplied] = useState({ search: '', category: 'ALL' })

  // Fetch Farmer Produce Listings (Crops/Produce) for Customers to buy
  const { data: listings, loading } = useApi(
    () => api.get<any[]>('/broker/marketplace', {
      cropType: applied.category === 'ALL' ? undefined : applied.category,
      limit: 60,
    }).then(r => r.data), [applied]
  )

  const listingsList: any[] = Array.isArray(listings) ? listings : ((listings as any)?.items ?? (listings as any)?.data ?? [])
  const cartCount = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Fresh Harvest Marketplace</h1>
          <p className="text-sm text-muted">Direct fresh farm produce from local farmers</p>
        </div>
        <Link href="/customer/cart">
          <Button variant="secondary">
            <ShoppingCart className="h-4 w-4" />Cart
            {cartCount > 0 && <span className="ml-1 rounded-full bg-vine px-1.5 py-0.5 text-xs text-white">{cartCount}</span>}
          </Button>
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="relative mb-6 overflow-hidden rounded-3xl p-6 text-white gradient-dashboard-1 pulse-glow-card shadow-xl">
        <div className="relative z-10 flex flex-col gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-emerald-100 w-fit">100% Direct Farm Fresh</span>
          <h2 className="font-display text-2xl font-bold">Buy Fresh Grapes, Fruits & Organic Vegetables</h2>
          <p className="text-sm text-emerald-100/90">Supporting local farmers across Nashik, Pune & Maharashtra districts.</p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Grapes, Tomatoes, Vegetables…" />
          </div>
          <div className="w-48">
            <Select value={category} onChange={e => setCategory(e.target.value)}>
              {CROP_CATEGORIES.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Crop Produce' : c}</option>)}
            </Select>
          </div>
          <Button onClick={() => setApplied({ search, category })}>
            <Search className="h-4 w-4" />Filter Produce
          </Button>
        </div>
      </Card>

      {loading ? <Spinner label="Loading fresh harvest listings…" /> : listingsList.length === 0 ? (
        <EmptyState icon={<Sprout className="h-8 w-8 text-vine" />} title="No farm produce found" hint="Try adjusting your crop category search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listingsList.map((l: any) => {
            const productAdapter = {
              id: l.id,
              name: `${l.cropType}${l.variety ? ` (${l.variety})` : ''}`,
              category: l.cropType,
              price: l.expectedPrice,
              unit: l.unit,
              sellerId: l.farmerId
            }
            const inCart = items.find(i => i.product.id === l.id)

            return (
              <Card key={l.id} className="overflow-hidden card-hover flex flex-col">
                <div className="relative h-44 overflow-hidden">
                  <img src={getCropImage(l.cropType, l.id, '400x300')} alt={l.cropType}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                  <div className="absolute top-2 left-2">
                    <Pill className="bg-white/90 text-vine-deep shadow text-xs font-semibold">{l.cropType}</Pill>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <p className="font-display font-bold text-ink">{l.cropType}</p>
                    <span className="text-xs text-muted font-mono">{formatQty(l.availableQuantity, l.unit)} available</span>
                  </div>
                  {l.variety && <p className="text-xs text-muted">Variety: {l.variety}</p>}
                  {l.description && <p className="mt-1 flex-1 text-xs text-muted line-clamp-2">{l.description}</p>}

                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-mono text-xl font-bold text-vine">{formatINR(l.expectedPrice)}</span>
                    <span className="text-xs text-muted">per {l.unit}</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      className="w-full text-xs font-bold"
                      variant={inCart ? 'secondary' : 'primary'}
                      onClick={() => { add(productAdapter as any, 1); show('success', `${l.cropType} added to cart`) }}
                    >
                      {inCart ? 'In Cart' : 'Buy Fresh Produce'}
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
