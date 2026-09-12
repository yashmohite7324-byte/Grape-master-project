'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Card, Pill, Spinner, EmptyState } from '@/components/ui'
import { formatINR, formatDate, statusStyle } from '@/lib/format'
import type { Order, OrderStatus } from '@/lib/types'

const FILTERS: (OrderStatus | 'ALL')[] = ['ALL', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED']

export default function SellerOrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')

  const { data, loading, error } = useApi(
    () => api.get<Order[]>('/seller/orders', {
      limit: 100, status: filter === 'ALL' ? undefined : filter
    }).then(r => r.data), [filter]
  )

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Orders</h1>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx('rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f ? 'bg-vine text-white' : 'border border-line bg-white text-muted hover:border-vine')}>
            {f === 'ALL' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="No orders" hint="Farmer orders appear here." />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper">
              <tr>{['Order #', 'Date', 'Buyer', 'Total', 'Fulfillment', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(data ?? []).map(o => (
                <tr key={o.id} className="hover:bg-paper/50">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-ink">{o.buyer?.profile?.fullName ?? '—'}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-ink">{formatINR(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-muted">{o.fulfillmentMethod}</td>
                  <td className="px-4 py-3"><Pill className={statusStyle[o.orderStatus]}>{o.orderStatus.replace('_', ' ')}</Pill></td>
                  <td className="px-4 py-3"><Link href={`/seller/orders/${o.id}`} className="text-vine hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
