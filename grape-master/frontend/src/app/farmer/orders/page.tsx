'use client'

import Link from 'next/link'
import { Package, Truck, CheckCircle2, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Card, Pill, Spinner, EmptyState, Button } from '@/components/ui'
import { formatINR, formatDate, statusStyle } from '@/lib/format'
import type { Order } from '@/lib/types'

export default function FarmerOrdersPage() {
  const { data, loading, error } = useApi(
    () => api.get<Order[]>('/orders', { limit: 100 }).then(r => r.data), []
  )

  const ordersList: Order[] = Array.isArray(data) ? data : ((data as any)?.items ?? (data as any)?.data ?? [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">My Fertilizer Orders</h1>
          <p className="text-sm text-muted">Track your ordered fertilizers, seeds, and agricultural inputs.</p>
        </div>
        <Link href="/farmer/marketplace">
          <Button variant="secondary">Browse Fertilizers</Button>
        </Link>
      </div>

      {loading ? <Spinner label="Loading your orders..." /> : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : ordersList.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8 text-vine" />}
          title="No orders placed yet"
          hint="Order fertilizers & inputs directly from verified dealers with home delivery."
          action={<Link href="/farmer/marketplace"><Button>Buy Inputs Now</Button></Link>}
        />
      ) : (
        <div className="space-y-4">
          {ordersList.map(o => (
            <Card key={o.id} className="p-5 hover:border-vine transition-all border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-slate-900">{o.orderNumber}</span>
                    <Pill className={statusStyle[o.orderStatus] ?? 'bg-slate-100 text-slate-700'}>
                      {(o.orderStatus ?? 'PENDING').replace('_', ' ')}
                    </Pill>
                  </div>
                  <p className="text-xs text-muted">
                    Placed on {formatDate(o.createdAt)} · Method: <span className="font-semibold text-slate-700">{o.fulfillmentMethod}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-extrabold text-vine">{formatINR(o.totalAmount)}</p>
                  <p className="text-xs text-emerald-700 font-semibold flex items-center justify-end gap-1 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Seller Notified
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {(o.orderItems ?? []).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 px-3 rounded-lg bg-slate-50">
                    <span className="font-semibold text-slate-800">{item.product?.name ?? 'Fertilizer Input'}</span>
                    <span className="font-mono text-slate-600">{item.quantity} x {formatINR(item.unitPrice)}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
