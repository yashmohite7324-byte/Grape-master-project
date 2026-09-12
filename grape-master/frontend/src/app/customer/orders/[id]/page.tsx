'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Button, Card, Pill, Spinner } from '@/components/ui'
import { formatINR, formatDate, formatDateTime, statusStyle } from '@/lib/format'
import type { Order, Receipt } from '@/lib/types'

const ORDER_STEPS = ['CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']

export default function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, loading } = useApi(
    () => api.get<Order>(`/orders/${id}`).then(r => r.data), [id]
  )
  const { data: receipt } = useApi(
    () => api.get<Receipt>(`/orders/${id}/receipt`).then(r => r.data).catch(() => null), [id]
  )

  if (loading || !data) return <Spinner />

  const stepIndex = ORDER_STEPS.indexOf(data.orderStatus)

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/customer/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />Back to orders
      </Link>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{data.orderNumber}</h1>
          <p className="text-sm text-muted">{formatDateTime(data.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill className={statusStyle[data.paymentStatus]}>{data.paymentStatus}</Pill>
          <Pill className={statusStyle[data.orderStatus]}>{data.orderStatus.replace(/_/g, ' ')}</Pill>
        </div>
      </div>

      {/* Order tracker */}
      {stepIndex >= 0 && (
        <Card className="mb-4 p-5">
          <h2 className="mb-4 text-sm font-medium text-muted">Order progress</h2>
          <div className="flex items-center gap-0">
            {ORDER_STEPS.map((step, i) => (
              <div key={step} className="flex flex-1 items-center">
                <div className={`h-3 w-3 shrink-0 rounded-full border-2 ${i <= stepIndex ? 'border-vine bg-vine' : 'border-line bg-white'}`} />
                {i < ORDER_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 ${i < stepIndex ? 'bg-vine' : 'bg-line'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between">
            {ORDER_STEPS.map((s, i) => (
              <p key={s} className={`text-center text-[10px] ${i <= stepIndex ? 'text-vine font-medium' : 'text-muted'}`} style={{ width: `${100 / ORDER_STEPS.length}%` }}>
                {s.replace(/_/g, ' ')}
              </p>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="mb-3 font-display text-base text-ink">Items ordered</h2>
          <ul className="divide-y divide-line">
            {data.orderItems.map(item => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">{item.product?.name ?? 'Product'} × {item.quantity} {item.product?.unit}</span>
                <span className="font-mono tabular-nums text-ink">{formatINR(item.totalPrice)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <BillRow label="Subtotal" value={formatINR(data.subtotal)} />
            {data.deliveryCharge > 0 && <BillRow label="Delivery" value={formatINR(data.deliveryCharge)} />}
            {data.tax > 0 && <BillRow label="Tax" value={formatINR(data.tax)} />}
            <BillRow label="Total" value={formatINR(data.totalAmount)} bold />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-base text-ink">Seller</h2>
          <p className="text-sm text-ink">{data.seller?.sellerProfile?.sellerName ?? data.seller?.profile?.fullName ?? '—'}</p>
          <p className="text-xs text-muted">{data.seller?.profile?.district}</p>
        </Card>

        {receipt?.pdfUrl && (
          <a href={receipt.pdfUrl} target="_blank" rel="noreferrer">
            <Button variant="secondary" className="w-full">
              <Download className="h-4 w-4" />Download receipt ({receipt.receiptNumber})
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}

function BillRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={`font-mono tabular-nums ${bold ? 'font-semibold text-ink' : 'text-muted'}`}>{value}</span>
    </div>
  )
}
