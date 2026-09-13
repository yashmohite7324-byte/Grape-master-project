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
  const [tab, setTab] = useState<'my' | 'market'>('my')
  const [busy, setBusy] = useState<string | null>(null)

  const { data: myData, loading: myLoading, error: myError, refetch } = useApi(
    () => api.get<BrokerOffer[]>('/farmer/offers', { limit: 100 }).then((r) => r.data),
    []
  )

  const { data: marketData, loading: marketLoading, error: marketError } = useApi(
    () => api.get<BrokerOffer[]>('/broker/public-offers', { limit: 100 }).then((r) => r.data),
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

  const offers = tab === 'my' ? (myData ?? []) : (marketData ?? [])
  const loading = tab === 'my' ? myLoading : marketLoading
  const error = tab === 'my' ? myError : marketError

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Broker Offers & Bids</h1>
          <p className="text-xs text-slate-500 mt-1">Review direct bids on your crops or inspect live market offers from brokers.</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('my')}
            className={`px-4 py-2 rounded-lg transition ${tab === 'my' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            My Listing Offers
          </button>
          <button
            type="button"
            onClick={() => setTab('market')}
            className={`px-4 py-2 rounded-lg transition ${tab === 'market' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All Market Bids
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title={tab === 'my' ? 'No offers received yet' : 'No public market bids active'}
          hint={tab === 'my' ? 'Brokers who want your produce will send offers here.' : 'Active broker bids across all crop listings will appear here.'}
        />
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <Card key={o.id} className="p-5 border border-slate-200 hover:border-emerald-500 transition">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-ink text-base">
                      {o.listing?.cropType ?? 'Crop Listing'}
                      {o.listing?.variety ? ` · ${o.listing.variety}` : ''}
                    </p>
                    <Pill className={statusStyle[o.status]}>{o.status}</Pill>
                  </div>
                  <p className="mt-1 font-mono text-sm text-slate-700">
                    Offer: <span className="font-bold text-emerald-700">{formatINR(o.offerPrice)} / {o.listing?.unit ?? 'unit'}</span> ({formatQty(o.quantity, o.listing?.unit ?? '')}) ={' '}
                    <span className="font-extrabold text-ink">{formatINR(o.totalAmount)}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Broker: <span className="font-semibold text-slate-800">{o.broker?.brokerProfile?.companyName || o.broker?.brokerProfile?.brokerName || o.broker?.profile?.fullName || 'Broker Firm'}</span>
                    {o.broker?.profile?.district ? ` (${o.broker.profile.district})` : ''} · {formatDate(o.createdAt)}
                  </p>
                </div>

                {tab === 'my' && o.status === 'PENDING' && (
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
