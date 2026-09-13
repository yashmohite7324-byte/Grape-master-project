'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/components/Toast'
import { Button, Card, Field, Input, Textarea, Spinner } from '@/components/ui'
import { formatQty, formatINR, formatDate } from '@/lib/format'
import type { FarmerListing } from '@/lib/types'

export default function MarketplaceListingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { show } = useToast()

  const { data, loading, error } = useApi(
    () => api.get<FarmerListing>(`/broker/marketplace/${id}`).then((r) => r.data),
    [id]
  )

  const [quantity, setQuantity] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [discountPercent, setDiscountPercent] = useState('')
  const [discountMinQty, setDiscountMinQty] = useState('')

  const total =
    Number(quantity) > 0 && Number(offerPrice) > 0 ? Number(quantity) * Number(offerPrice) : 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    try {
      await api.post(`/broker/marketplace/${id}/offer`, {
        quantity: Number(quantity),
        offerPrice: Number(offerPrice),
        discountPercent: Number(discountPercent) || 0,
        discountMinQty: Number(discountMinQty) || 0,
        message: message || undefined,
      })
      show('success', 'Offer with Bulk Discount created!')
      router.push('/broker/offers')
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors(Object.fromEntries(err.fields.map((f) => [f.field, f.message])))
      }
      show('error', err instanceof ApiError ? err.message : 'Could not submit offer')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner label="Loading listing…" />
  if (error || !data)
    return <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error ?? 'Not found'}</p>

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/broker/marketplace" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to marketplace
      </Link>

      <Card className="p-6">
        <h1 className="font-display text-3xl font-semibold text-ink">{data.cropType}</h1>
        {data.variety && <p className="mt-0.5 text-muted">{data.variety}</p>}

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Meta label="Available" value={formatQty(data.availableQuantity, data.unit)} />
          <Meta label="Asking" value={`${formatINR(data.expectedPrice)}/${data.unit}`} />
          <Meta label="Harvest" value={formatDate(data.harvestDate)} />
          <Meta
            label="Farmer"
            value={data.farmer?.profile?.fullName ?? '—'}
          />
        </dl>

        {data.description && (
          <p className="mt-5 rounded-lg bg-paper px-4 py-3 text-sm text-ink">{data.description}</p>
        )}
      </Card>

      {/* Make offer */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 font-display text-xl text-ink">Make an offer</h2>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={`Quantity (${data.unit})`}
              hint={`Up to ${formatQty(data.availableQuantity, data.unit)}`}
              error={fieldErrors.quantity}
            >
              <Input
                type="number"
                min="1"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field label="Your price per unit (₹)" error={fieldErrors.offerPrice}>
              <Input
                type="number"
                min="1"
                step="any"
                required
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
              />
            </Field>
          </div>

          {/* Bulk Quantity Discount Creation */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              🎁 Offer Bulk Quantity Discount to Farmer (Optional)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Discount Percent (%)" hint="e.g. 5% or 10% discount">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 5"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                />
              </Field>
              <Field label={`Minimum Quantity for Discount (${data.unit})`} hint="e.g. if farmer sells >= 50 units">
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={discountMinQty}
                  onChange={(e) => setDiscountMinQty(e.target.value)}
                />
              </Field>
            </div>
          </div>

          <Field label="Message" hint="Optional note to the farmer">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>

          <div className="flex items-center justify-between rounded-lg bg-vine-soft px-4 py-3">
            <span className="text-sm font-medium text-vine-deep">Offer total</span>
            <span className="font-mono text-lg font-semibold text-vine-deep">
              {formatINR(total)}
            </span>
          </div>

          <Button type="submit" loading={submitting}>
            Submit offer
          </Button>
        </form>
      </Card>
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
