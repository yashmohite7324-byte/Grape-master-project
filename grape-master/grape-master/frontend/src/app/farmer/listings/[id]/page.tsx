'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, X } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/components/Toast'
import { Button, Card, Pill, Spinner, EmptyState } from '@/components/ui'
import { formatQty, formatINR, formatDate, statusStyle } from '@/lib/format'
import type { FarmerListing } from '@/lib/types'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { show } = useToast()
  const [busy, setBusy] = useState<string | null>(null)

  const { data, loading, error, refetch } = useApi(
    () => api.get<FarmerListing>(`/farmer/listings/${id}`).then((r) => r.data),
    [id]
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

  if (loading) return <Spinner label="Loading listing…" />
  if (error || !data)
    return <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error ?? 'Not found'}</p>

  const offers = data.brokerOffers ?? []
  const pending = offers.filter((o) => o.status === 'PENDING')
  const resolved = offers.filter((o) => o.status !== 'PENDING')

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/farmer/listings" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>

      {/* Listing header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">{data.cropType}</h1>
            {data.variety && <p className="mt-0.5 text-muted">{data.variety}</p>}
          </div>
          <Pill className={statusStyle[data.status]}>{data.status}</Pill>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Meta label="Listed" value={formatQty(data.quantity, data.unit)} />
          <Meta label="Available" value={formatQty(data.availableQuantity, data.unit)} />
          <Meta label="Asking" value={`${formatINR(data.expectedPrice)}/${data.unit}`} />
          <Meta label="Harvest" value={formatDate(data.harvestDate)} />
        </dl>

        {data.description && (
          <p className="mt-5 rounded-lg bg-paper px-4 py-3 text-sm text-ink">{data.description}</p>
        )}
      </Card>

      {/* Pending offers */}
      <h2 className="mb-3 mt-8 font-display text-xl text-ink">
        Pending offers {pending.length > 0 && <span className="text-muted">({pending.length})</span>}
      </h2>
      {pending.length === 0 ? (
        <EmptyState title="No offers waiting" hint="When a broker makes an offer, it appears here for you to accept or decline." />
      ) : (
        <div className="space-y-3">
          {pending.map((o) => (
            <Card key={o.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-ink">
                    {o.broker?.brokerProfile?.brokerName ?? o.broker?.profile?.fullName ?? 'Broker'}
                  </p>
                  <p className="mt-1 font-mono text-sm text-muted">
                    {formatQty(o.quantity, data.unit)} @ {formatINR(o.offerPrice)}/{data.unit} ={' '}
                    <span className="font-semibold text-ink">{formatINR(o.totalAmount)}</span>
                  </p>
                  {o.message && <p className="mt-2 text-sm text-muted">“{o.message}”</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    loading={busy === o.id + 'accept'}
                    onClick={() => act(o.id, 'accept')}
                  >
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
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Resolved offers */}
      {resolved.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-display text-xl text-ink">History</h2>
          <div className="space-y-2">
            {resolved.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3"
              >
                <p className="font-mono text-sm text-muted">
                  {formatQty(o.quantity, data.unit)} @ {formatINR(o.offerPrice)}/{data.unit}
                </p>
                <Pill className={statusStyle[o.status]}>{o.status}</Pill>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 font-mono tabular-nums text-ink">{value}</dd>
    </div>
  )
}
