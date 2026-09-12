'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/components/Toast'
import { Button, Card, Pill, Spinner, Select, Field } from '@/components/ui'
import { formatINR, formatDate, formatDateTime, statusStyle } from '@/lib/format'
import type { Order, OrderStatus } from '@/lib/types'

const NEXT_STATUSES: Record<string, OrderStatus[]> = {
  CONFIRMED: ['PROCESSING'],
  PROCESSING: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
  READY_FOR_PICKUP: ['DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
}

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { show } = useToast()
  const [newStatus, setNewStatus] = useState('')
  const [updating, setUpdating] = useState(false)

  const { data, loading, refetch } = useApi(
    () => api.get<Order>(`/seller/orders/${id}`).then(r => r.data), [id]
  )

  const updateStatus = async () => {
    if (!newStatus) return
    setUpdating(true)
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus })
      show('success', 'Status updated'); refetch(); setNewStatus('')
    } catch (err) {
      show('error', err instanceof ApiError ? err.message : 'Update failed')
    } finally { setUpdating(false) }
  }

  if (loading || !data) return <Spinner />
  const nextOptions = NEXT_STATUSES[data.orderStatus] ?? []

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/seller/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />Back to orders
      </Link>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{data.orderNumber}</h1>
          <p className="text-sm text-muted">{formatDateTime(data.createdAt)}</p>
        </div>
        <Pill className={statusStyle[data.orderStatus]}>{data.orderStatus.replace('_', ' ')}</Pill>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="mb-3 font-display text-base text-ink">Buyer</h2>
          <p className="text-sm text-ink">{data.buyer?.profile?.fullName ?? '—'}</p>
          <p className="text-xs text-muted">{data.buyer?.profile?.village}, {data.buyer?.profile?.district}</p>
          <p className="mt-1 text-xs text-muted">Fulfillment: <span className="font-medium text-ink">{data.fulfillmentMethod}</span></p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-base text-ink">Items</h2>
          <ul className="divide-y divide-line">
            {data.orderItems.map(item => (
              <li key={item.id} className="flex items-center justify-between py-2">
                <p className="text-sm text-ink">{item.product?.name ?? 'Product'} × {item.quantity} {item.product?.unit}</p>
                <span className="font-mono text-sm tabular-nums text-ink">{formatINR(item.totalPrice)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <Row label="Subtotal" value={formatINR(data.subtotal)} />
            {data.deliveryCharge > 0 && <Row label="Delivery" value={formatINR(data.deliveryCharge)} />}
            {data.tax > 0 && <Row label="Tax" value={formatINR(data.tax)} />}
            <Row label="Total" value={formatINR(data.totalAmount)} bold />
          </div>
        </Card>

        {nextOptions.length > 0 && (
          <Card className="p-5">
            <h2 className="mb-3 font-display text-base text-ink">Update status</h2>
            <div className="flex gap-3">
              <Field label="">
                <Select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="">Select next status…</option>
                  {nextOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </Select>
              </Field>
              <Button loading={updating} onClick={updateStatus} disabled={!newStatus}>Update</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={`font-mono tabular-nums ${bold ? 'font-semibold text-ink' : 'text-muted'}`}>{value}</span>
    </div>
  )
}
