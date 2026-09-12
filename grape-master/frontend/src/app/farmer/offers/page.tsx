'use client'

import { useState } from 'react'
import { Inbox, Check, X } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/components/Toast'
import { Button, Card, Pill, Spinner, EmptyState } from '@/components/ui'
import { formatQty, formatINR, formatDate, statusStyle } from '@/lib/format'
import type { BrokerOffer } from '@/lib/types'

export default function FarmerOffersPage() {
  const { show } = useToast()
  const [busy, setBusy] = useState<string | null>(null)

  const { data, loading, error, refetch } = useApi(
    () => api.get<BrokerOffer[]>('/farmer/offers', { limit: 100 }).then((r) => r.data),
    []
  )

  const act = async (offerId: string, action: 'accept' | 'reject') => {
    setBusy(offerId + action)
    try {
      await api.post(`/farmer/offers/${offerId}/${action}`)
      show('success', action === 'accept' ? 'Offer accepted' : 'Offer rejected')
      refetch()
    } catch (err) {
      show('error', err instanceof ApiError ? err.message : 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  const offers = data ?? []

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Offers</h1>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title="No offers yet"
          hint="Brokers who want your produce will send offers here."
        />
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <Card key={o.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">
                      {o.listing?.cropType ?? 'Listing'}
                      {o.listing?.variety ? ` · ${o.listing.variety}` : ''}
                    </p>
                    <Pill className={statusStyle[o.status]}>{o.status}</Pill>
                  </div>
                  <p className="mt-1 font-mono text-sm text-muted">
                    {formatQty(o.quantity, o.listing?.unit ?? '')} @ {formatINR(o.offerPrice)}/
                    {o.listing?.unit} ={' '}
                    <span className="font-semibold text-ink">{formatINR(o.totalAmount)}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    from {o.broker?.brokerProfile?.brokerName ?? o.broker?.profile?.fullName ?? 'Broker'} ·{' '}
                    {formatDate(o.createdAt)}
                  </p>
                </div>

                {o.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <Button loading={busy === o.id + 'accept'} onClick={() => act(o.id, 'accept')}>
                      <Check className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      loading={busy === o.id + 'reject'}
                      onClick={() => act(o.id, 'reject')}
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
