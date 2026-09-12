'use client'
import { useState } from 'react'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Spinner, Pill, EmptyState } from '@/components/ui'
import { formatINR, formatDate, statusStyle } from '@/lib/format'
import type { Order, OrderStatus } from '@/lib/types'

const FILTERS: (OrderStatus | 'ALL')[] = ['ALL', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'COMPLETED', 'CANCELLED']

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')

  const { data, loading, error } = useApi(
    () => api.get<Order[]>('/admin/orders', { status: filter === 'ALL' ? undefined : filter, limit: 200 }).then(r => r.data),
    [filter]
  )

  const ordersList: Order[] = Array.isArray(data) ? data : ((data as any)?.items ?? (data as any)?.data ?? [])

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">All orders</h1>

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
      ) : ordersList.length === 0 ? (
        <EmptyState title="No orders found" />
      ) : (
        <div className="overflow-auto rounded-card border border-line bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper">
              <tr>{['Order #', 'Date', 'Type', 'Buyer', 'Seller', 'Total', 'Payment', 'Status'].map(h => (
                <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ordersList.map((o: Order) => (
                <tr key={o.id} className="hover:bg-paper/50">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-muted">{(o.orderType ?? 'FERTILIZER').replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-ink">{o.buyer?.profile?.fullName ?? 'Buyer'}</td>
                  <td className="px-4 py-3 text-ink">{o.seller?.profile?.fullName ?? 'Seller'}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-ink">{formatINR(o.totalAmount)}</td>
                  <td className="px-4 py-3"><Pill className={statusStyle[o.paymentStatus] ?? 'bg-slate-100 text-slate-700'}>{o.paymentStatus ?? 'PENDING'}</Pill></td>
                  <td className="px-4 py-3"><Pill className={statusStyle[o.orderStatus] ?? 'bg-slate-100 text-slate-700'}>{(o.orderStatus ?? 'PENDING').replace('_', ' ')}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
