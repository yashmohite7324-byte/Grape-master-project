'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Grape, Printer, Download, ArrowLeft, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatINR, formatDate } from '@/lib/format'
import { Spinner } from '@/components/ui'

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get<any>(`/orders/${id}`).then(r => {
      setOrder(r.data)
      setLoading(false)
    }).catch(() => { setLoading(false) })
  }, [id])

  const handlePrint = () => window.print()

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>
  if (!order) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-muted">Order not found.</p>
      <Link href="/" className="text-sm text-vine hover:underline">Go home</Link>
    </div>
  )

  const txn = order.transaction
  const txnId = txn?.transactionNumber ?? txn?.gatewayTransactionId ?? `TXN-${id.slice(0, 8).toUpperCase()}`

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .receipt-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-white px-4 py-3">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex-1" />
        <button onClick={handlePrint} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper">
          <Printer className="h-4 w-4" /> Print
        </button>
        <a
          href={`/api/orders/${id}/receipt.pdf`}
          className="flex items-center gap-1.5 rounded-lg bg-vine px-3 py-1.5 text-sm font-medium text-white hover:bg-vine-deep"
        >
          <Download className="h-4 w-4" /> Download PDF
        </a>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <div ref={printRef} className="receipt-card rounded-2xl border border-line bg-white shadow-card">
          {/* Header */}
          <div className="border-b border-line p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Grape className="h-7 w-7 text-grape" />
                  <span className="font-display text-xl font-bold text-ink">Grape Master</span>
                </div>
                <p className="mt-1 text-xs text-muted">Agricultural Marketplace · Maharashtra</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted">Receipt</p>
                <p className="mt-1 font-mono text-lg font-bold text-ink">{order.orderNumber}</p>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className="bg-green-50 px-8 py-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Payment Confirmed</span>
              <span className="ml-auto font-mono text-sm">{txnId}</span>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6 border-b border-line p-8">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Sold By</p>
              <p className="font-semibold text-ink">{order.seller?.fullName ?? 'Seller'}</p>
              {order.seller?.sellerProfile?.businessName && (
                <p className="text-sm text-muted">{order.seller.sellerProfile.businessName}</p>
              )}
              {order.seller?.profile?.district && (
                <p className="text-sm text-muted">{order.seller.profile.district}, {order.seller.profile.state}</p>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Purchased By</p>
              <p className="font-semibold text-ink">{order.buyer?.fullName ?? 'Buyer'}</p>
              {order.buyer?.profile?.village && (
                <p className="text-sm text-muted">{order.buyer.profile.village}, {order.buyer.profile.district}</p>
              )}
            </div>
          </div>

          {/* Items table */}
          <div className="p-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="pb-3 text-left font-semibold text-muted">Item</th>
                  <th className="pb-3 text-right font-semibold text-muted">Qty</th>
                  <th className="pb-3 text-right font-semibold text-muted">Unit Price</th>
                  <th className="pb-3 text-right font-semibold text-muted">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(order.orderItems ?? []).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-line/50">
                    <td className="py-3">
                      <p className="font-medium text-ink">{item.productName ?? item.product?.name}</p>
                      <p className="text-xs text-muted">{item.product?.category}</p>
                    </td>
                    <td className="py-3 text-right text-muted">{item.quantity} {item.product?.unit ?? ''}</td>
                    <td className="py-3 text-right text-muted font-mono">{formatINR(item.unitPrice)}</td>
                    <td className="py-3 text-right font-mono font-semibold text-ink">{formatINR(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-6 space-y-2 border-t border-line pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-mono">{formatINR(order.subtotal ?? order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Delivery</span>
                <span className="font-mono text-green-700">{(order.deliveryCharge ?? 0) > 0 ? formatINR(order.deliveryCharge) : 'Free'}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
                <span>Total Paid</span>
                <span className="font-mono text-vine">{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-line bg-paper p-8 text-center">
            <p className="text-sm text-muted">
              Thank you for trading on Grape Master · {formatDate(order.createdAt ?? new Date().toISOString())}
            </p>
            <p className="mt-1 text-xs text-muted/60">Transaction ID: {txnId}</p>
          </div>
        </div>
      </div>
    </>
  )
}
