'use client'

import { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { clsx } from 'clsx'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/components/Toast'
import { Button, Card, Pill, Spinner, EmptyState } from '@/components/ui'
import { formatQty, formatINR, formatDate, statusStyle } from '@/lib/format'
import type { BrokerOffer, OfferStatus } from '@/lib/types'

const FILTERS: (OfferStatus | 'ALL')[] = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']

export default function BrokerOffersPage() {
  const { show } = useToast()
  const [filter, setFilter] = useState<OfferStatus | 'ALL'>('ALL')
  const [busy, setBusy] = useState<string | null>(null)

  const { data, loading, error, refetch } = useApi(
    () =>
      api
        .get<BrokerOffer[]>('/broker/offers', {
          limit: 100,
          status: filter === 'ALL' ? undefined : filter,
        })
        .then((r) => r.data),
    [filter]
  )

  const withdraw = async (offerId: string) => {
    setBusy(offerId)
    try {
      await api.patch(`/broker/offers/${offerId}/withdraw`)
      show('success', 'Offer withdrawn')
      refetch()
    } catch (err) {
      show('error', err instanceof ApiError ? err.message : 'Could not withdraw offer')
    } finally {
      setBusy(null)
    }
  }

  const offers = data ?? []

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">My offers</h1>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f
                ? 'bg-vine text-white'
                : 'border border-line bg-white text-muted hover:border-vine'
            )}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-8 w-8" />}
          title="No offers here"
          hint="Offers you make in the marketplace appear here."
        />
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <Card key={o.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg font-medium text-ink">
                      {o.listing?.cropType ?? 'Listing'}
                      {o.listing?.variety ? ` · ${o.listing.variety}` : ''}
                    </p>
                    <Pill className={statusStyle[o.status]}>{o.status}</Pill>
                  </div>
                  <p className="mt-1 font-mono text-sm tabular-nums text-muted">
                    {formatQty(o.quantity, o.listing?.unit ?? '')} @{' '}
                    {formatINR(o.offerPrice)}/{o.listing?.unit} ={' '}
                    <span className="font-semibold text-ink">{formatINR(o.totalAmount)}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    From {o.listing?.farmer?.profile?.fullName ?? 'Farmer'} ·{' '}
                    {o.listing?.farmer?.profile?.district} · {formatDate(o.createdAt)}
                  </p>
                  {o.message && (
                    <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm text-muted">
                      "{o.message}"
                    </p>
                  )}
                </div>
                {o.status === 'PENDING' && (
                  <Button
                    variant="secondary"
                    loading={busy === o.id}
                    onClick={() => withdraw(o.id)}
                  >
                    <X className="h-4 w-4" />
                    Withdraw
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
