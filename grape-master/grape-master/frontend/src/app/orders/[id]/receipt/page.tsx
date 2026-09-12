'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Download, Printer, ArrowLeft, CheckCircle2, Grape } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Spinner } from '@/components/ui'
import { formatINR, formatDateTime } from '@/lib/format'

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, loading } = useApi(
    () => api.get<any>(`/orders/${id}`).then(r => r.data), [id]
  )

  if (loading || !order) return <Spinner label="Loading receipt…" />

  const receipt = order.receipt
  const txn = order.transaction

  return (
    <div className="min-h-screen bg-paper py-10 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Actions */}
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/orders/${id}`} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" />Back to order
          </Link>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-muted hover:text-ink">
              <Printer className="h-4 w-4" />Print
            </button>
            {receipt?.pdfUrl && (
              <a href={receipt.pdfUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-vine px-3 py-1.5 text-sm text-white hover:bg-vine-deep">
                <Download className="h-4 w-4" />Download PDF
              </a>
            )}
          </div>
        </div>

        {/* Receipt card — print-friendly */}
        <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden" id="receipt-print">
          {/* Receipt header */}
          <div className="gradient-vine p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Grape className="h-7 w-7 text-white" />
              <span className="font-display text-2xl font-bold text-white">Grape Master</span>
            </div>
            <p className="text-white/70 text-sm">Agricultural Marketplace · Nashik, Maharashtra</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-300" />
              <span className="text-lg font-semibold text-white">Payment Confirmed</span>
            </div>
          </div>

          {/* Receipt numbers */}
          <div className="border-b border-line bg-paper px-6 py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">Receipt No.</p>
                <p className="font-mono text-sm font-bold text-ink mt-0.5">{receipt?.receiptNumber ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">Order No.</p>
                <p className="font-mono text-sm font-bold text-ink mt-0.5">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">Transaction</p>
                <p className="font-mono text-sm font-bold text-ink mt-0.5">{txn?.transactionNumber ?? '—'}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Parties */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Buyer</p>
                <p className="font-medium text-ink">{order.buyer?.profile?.fullName ?? '—'}</p>
                <p className="text-sm text-muted">{order.buyer?.profile?.village}, {order.buyer?.profile?.district}</p>
                <p className="text-sm text-muted">{order.buyer?.profile?.state}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Seller</p>
                <p className="font-medium text-ink">{order.seller?.sellerProfile?.sellerName ?? order.seller?.profile?.fullName ?? '—'}</p>
                <p className="text-sm text-muted">{order.seller?.profile?.village}, {order.seller?.profile?.district}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Items purchased</p>
              <div className="rounded-lg border border-line overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-paper">
                    <tr>
                      {['Product', 'Qty', 'Unit Price', 'Total'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {order.orderItems?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2.5 text-ink">{item.product?.name ?? 'Product'}</td>
                        <td className="px-3 py-2.5 font-mono text-muted">{item.quantity} {item.product?.unit}</td>
                        <td className="px-3 py-2.5 font-mono text-muted">{formatINR(item.unitPrice)}</td>
                        <td className="px-3 py-2.5 font-mono font-semibold text-ink">{formatINR(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-lg bg-paper p-4 space-y-2">
              {[
                ['Subtotal', order.subtotal],
                order.deliveryCharge > 0 ? ['Delivery charge', order.deliveryCharge] : null,
                order.tax > 0 ? ['Tax', order.tax] : null,
                order.discount > 0 ? ['Discount', -order.discount] : null,
              ].filter(Boolean).map((row: any) => (
                <div key={row[0]} className="flex justify-between text-sm">
                  <span className="text-muted">{row[0]}</span>
                  <span className="font-mono text-ink">{formatINR(Math.abs(row[1]))}{row[1] < 0 ? ' (off)' : ''}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-line pt-2 font-semibold">
                <span className="text-ink">Total Paid</span>
                <span className="font-mono text-xl text-vine">{formatINR(order.totalAmount)}</span>
              </div>
            </div>

            {/* Payment details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Payment method</p>
                <p className="font-medium text-ink">{txn?.paymentMethod ?? 'PhonePe'}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Date & Time</p>
                <p className="font-medium text-ink">{formatDateTime(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Fulfillment</p>
                <p className="font-medium text-ink">{order.fulfillmentMethod}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Status</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-vine-soft px-2.5 py-0.5 text-xs font-semibold text-vine-deep">
                  <CheckCircle2 className="h-3 w-3" />PAID
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-line bg-paper px-6 py-4 text-center">
            <p className="text-xs text-muted">Thank you for using Grape Master</p>
            <p className="text-xs text-muted">For support: support@grapemaster.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
