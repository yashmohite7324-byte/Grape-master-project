'use client'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Card, Pill, Spinner, EmptyState } from '@/components/ui'
import { formatINR, formatDate, statusStyle } from '@/lib/format'
import type { Order } from '@/lib/types'

export default function CustomerOrdersPage() {
  const { data, loading, error } = useApi(
    () => api.get<Order[]>('/orders', { limit: 100 }).then(r => r.data), []
  )

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">My orders</h1>

      {loading ? <Spinner /> : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={<Package className="h-8 w-8" />} title="No orders yet"
          action={<Link href="/customer" className="text-vine font-medium hover:underline">Browse products</Link>} />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map(o => (
            <Card key={o.id} className="p-5 hover:border-vine transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-ink">{o.orderNumber}</p>
                    <Pill className={statusStyle[o.orderStatus]}>{o.orderStatus.replace('_', ' ')}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(o.createdAt)} · {o.fulfillmentMethod} · {o.orderItems.length} item{o.orderItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-bold text-ink">{formatINR(o.totalAmount)}</span>
                  <Link href={`/orders/${o.id}/receipt`} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-black transition">
                    📄 Receipt
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
