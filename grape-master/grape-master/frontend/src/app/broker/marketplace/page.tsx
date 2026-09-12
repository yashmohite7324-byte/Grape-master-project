'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Store } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Card, Field, Input, Select, Spinner, EmptyState, Button, Pill } from '@/components/ui'
import { formatQty, formatINR, formatDate, statusStyle } from '@/lib/format'
import { getCropImage } from '@/lib/images'
import type { FarmerListing } from '@/lib/types'

export default function BrokerMarketplacePage() {
  const [f, setF] = useState({ cropType: '', district: '', maxPrice: '', sort: 'newest' as const })
  const [applied, setApplied] = useState(f)

  const { data, loading } = useApi(
    () => api.get<FarmerListing[]>('/broker/marketplace', {
      cropType: applied.cropType || undefined, district: applied.district || undefined,
      maxPrice: applied.maxPrice || undefined, sort: applied.sort, limit: 60,
    }).then(r => r.data), [applied]
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Farmer Marketplace</h1>
        <span className="text-sm text-muted">{(data ?? []).length} listings available</span>
      </div>

      <Card className="mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Crop type">
            <Input value={f.cropType} onChange={e => setF(x => ({...x, cropType: e.target.value}))} placeholder="Grapes, Onion…" />
          </Field>
          <Field label="District">
            <Input value={f.district} onChange={e => setF(x => ({...x, district: e.target.value}))} placeholder="Nashik, Pune…" />
          </Field>
          <Field label="Max price (₹/unit)">
            <Input type="number" value={f.maxPrice} onChange={e => setF(x => ({...x, maxPrice: e.target.value}))} />
          </Field>
          <Field label="Sort">
            <Select value={f.sort} onChange={e => setF(x => ({...x, sort: e.target.value as typeof f.sort}))}>
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: low → high</option>
              <option value="priceDesc">Price: high → low</option>
              <option value="quantityDesc">Quantity: high → low</option>
            </Select>
          </Field>
        </div>
        <div className="mt-3">
          <Button onClick={() => setApplied(f)}><Search className="h-4 w-4" />Apply filters</Button>
        </div>
      </Card>

      {loading ? <Spinner /> : (data ?? []).length === 0 ? (
        <EmptyState icon={<Store className="h-8 w-8" />} title="No listings match" hint="Try widening your filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map(l => (
            <Link key={l.id} href={`/broker/marketplace/${l.id}`}>
              <Card className="overflow-hidden card-hover group">
                <div className="relative h-44 overflow-hidden">
                  <img src={getCropImage(l.cropType, l.id, '400x200')}
                    alt={l.cropType} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <h3 className="font-display text-xl font-bold text-white">{l.cropType}</h3>
                    {l.variety && <p className="text-xs text-white/80">{l.variety}</p>}
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-vine-deep">
                      {l.farmer?.profile?.district ?? '—'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><dt className="text-muted">Available</dt><dd className="font-mono font-semibold text-ink">{formatQty(l.availableQuantity, l.unit)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Asking</dt><dd className="font-mono text-vine font-bold">{formatINR(l.expectedPrice)}/{l.unit}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Harvest</dt><dd className="font-mono text-muted">{formatDate(l.harvestDate)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Farmer</dt><dd className="text-ink">{l.farmer?.profile?.fullName ?? '—'}</dd></div>
                  </dl>
                  <div className="mt-3 flex items-center justify-between">
                    <Button className="text-xs h-8 px-4">View & Offer</Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
