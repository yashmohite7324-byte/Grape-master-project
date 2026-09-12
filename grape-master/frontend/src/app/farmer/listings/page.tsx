'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Sprout } from 'lucide-react'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Button, Card, Pill, Spinner, EmptyState } from '@/components/ui'
import { formatQty, formatINR, formatDate, statusStyle } from '@/lib/format'
import { getCropImage } from '@/lib/images'
import type { FarmerListing, ListingStatus } from '@/lib/types'

const FILTERS: (ListingStatus | 'ALL')[] = ['ALL','ACTIVE','SOLD','CANCELLED']

export default function ListingsPage() {
  const [filter, setFilter] = useState<ListingStatus | 'ALL'>('ALL')
  const { data, loading, error } = useApi(
    () => api.get<FarmerListing[]>('/farmer/listings', {
      limit: 100, status: filter === 'ALL' ? undefined : filter
    }).then(r => r.data), [filter]
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">My listings</h1>
        <Link href="/farmer/listings/new"><Button><Plus className="h-4 w-4" />New listing</Button></Link>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx('rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f ? 'bg-vine text-white' : 'border border-line bg-white text-muted hover:border-vine')}>
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={<Sprout className="h-8 w-8" />} title="No listings"
          action={<Link href="/farmer/listings/new"><Button>Create listing</Button></Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map(l => (
            <Link key={l.id} href={`/farmer/listings/${l.id}`}>
              <Card className="overflow-hidden card-hover">
                <div className="relative h-40">
                  <img src={getCropImage(l.cropType, l.id, '400x200', l.images?.[0])} alt={l.cropType} className="h-full w-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <Pill className={statusStyle[l.status]}>{l.status}</Pill>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold text-ink">{l.cropType}</h3>
                  {l.variety && <p className="text-sm text-muted">{l.variety}</p>}
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-muted">Available</dt><dd className="font-mono text-ink">{formatQty(l.availableQuantity, l.unit)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Asking</dt><dd className="font-mono text-ink">{formatINR(l.expectedPrice)}/{l.unit}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Harvest</dt><dd className="font-mono text-ink">{formatDate(l.harvestDate)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Offers</dt><dd className="font-semibold text-vine">{l._count?.brokerOffers ?? 0}</dd></div>
                  </dl>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
