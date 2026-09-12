'use client'
import Link from 'next/link'
import { Users, ShoppingBag, TrendingUp, Package, Zap, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Card, Pill, Spinner, Stat } from '@/components/ui'
import { formatINR, formatDate, statusStyle } from '@/lib/format'
import type { AdminStats, Order } from '@/lib/types'

const ML_URL = process.env.NEXT_PUBLIC_ML_URL ?? 'http://localhost:8000'

export default function AdminDashboard() {
  const stats = useApi(() => api.get<AdminStats>('/admin/stats').then(r => r.data), [])
  const orders = useApi(() => api.get<Order[]>('/admin/orders', { limit: 8 }).then(r => r.data), [])
  const inventory = useApi(() => api.get<any>('/admin/inventory').then(r => r.data), [])
  // ML analytics fetched directly from ML service
  const mlStats = useApi(() => fetch(`${ML_URL}/analytics`).then(r => r.json()), [])

  if (stats.loading) return <Spinner label="Loading admin dashboard…" />
  const s = stats.data
  const inv = inventory.data
  const ml = mlStats.data

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl h-32">
        <img src="https://source.unsplash.com/1400x300/?agriculture,analytics,dashboard" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 to-ink/50" />
        <div className="relative z-10 flex h-full items-center px-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-white/70">Platform overview — Grape Master Agricultural Marketplace</p>
          </div>
        </div>
      </div>

      {/* Core stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={s?.users.total ?? '—'} />
        <Stat label="Farmers" value={s?.users.farmers ?? '—'} />
        <Stat label="Total orders" value={s?.orders.total ?? '—'} />
        <Stat label="Total revenue" value={s ? formatINR(s.revenue.total) : '—'} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Brokers" value={s?.users.brokers ?? '—'} />
        <Stat label="Input sellers" value={s?.users.sellers ?? '—'} />
        <Stat label="Active listings" value={s?.listings.active ?? '—'} />
        <Stat label="This month revenue" value={s ? formatINR(s.revenue.thisMonth) : '—'} />
      </div>

      {/* User breakdown bar */}
      {s && (
        <Card className="p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">User role distribution</h2>
          <div className="space-y-3">
            {[
              { label: 'Farmers', count: s.users.farmers, color: 'bg-vine' },
              { label: 'Customers', count: s.users.customers, color: 'bg-grape' },
              { label: 'Brokers', count: s.users.brokers, color: 'bg-harvest' },
              { label: 'Input Sellers', count: s.users.sellers, color: 'bg-ink/70' },
            ].map(({ label, count, color }) => {
              const pct = s.users.total > 0 ? Math.round((count / s.users.total) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted">{label}</span>
                    <span className="font-mono text-ink">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-line">
                    <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-vine hover:underline">View all</Link>
          </div>
          {orders.loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr>{['Order','Date','Amount','Status'].map(h => (
                  <th key={h} className="pb-2 text-left font-semibold uppercase tracking-wide text-muted">{h}</th>
                ))}</tr></thead>
                <tbody className="divide-y divide-line">
                  {(orders.data ?? []).map(o => (
                    <tr key={o.id} className="hover:bg-paper/50">
                      <td className="py-2 font-mono text-ink">{o.orderNumber}</td>
                      <td className="py-2 text-muted">{formatDate(o.createdAt)}</td>
                      <td className="py-2 font-mono font-semibold text-ink">{formatINR(o.totalAmount)}</td>
                      <td className="py-2"><Pill className={`${statusStyle[o.orderStatus]} text-[10px]`}>{o.orderStatus.replace('_',' ')}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Low stock alerts */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-harvest" />
            <h2 className="font-display text-base font-semibold text-ink">Low stock alerts</h2>
          </div>
          {inventory.loading ? <Spinner /> : (inv?.lowStock ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">All inventory levels are healthy ✓</p>
          ) : (
            <ul className="space-y-2">
              {(inv?.lowStock ?? []).slice(0, 6).map((item: any) => (
                <li key={item.id} className="flex items-center justify-between rounded-lg bg-harvest-soft px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.product?.name}</p>
                    <p className="text-xs text-muted">{item.seller?.sellerProfile?.sellerName ?? item.seller?.profile?.fullName}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-danger">{item.availableQuantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ML Analytics panel */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-grape" />
          <h2 className="font-display text-base font-semibold text-ink">ML Recommendation Analytics</h2>
          <span className="rounded-full bg-grape-soft px-2 py-0.5 text-xs text-grape">AI Engine</span>
        </div>
        {mlStats.loading ? <Spinner /> : ml ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg bg-paper p-3 text-center">
              <p className="font-mono text-2xl font-bold text-ink">{ml.total_events?.toLocaleString('en-IN') ?? 0}</p>
              <p className="text-xs text-muted">Total events</p>
            </div>
            <div className="rounded-lg bg-paper p-3 text-center">
              <p className="font-mono text-2xl font-bold text-ink">{ml.recommendation_views?.toLocaleString('en-IN') ?? 0}</p>
              <p className="text-xs text-muted">Rec. views</p>
            </div>
            <div className="rounded-lg bg-paper p-3 text-center">
              <p className="font-mono text-2xl font-bold text-vine">{ml.recommendation_clicks?.toLocaleString('en-IN') ?? 0}</p>
              <p className="text-xs text-muted">Rec. clicks</p>
            </div>
            <div className="rounded-lg bg-paper p-3 text-center">
              <p className="font-mono text-2xl font-bold text-grape">{ml.purchases?.toLocaleString('en-IN') ?? 0}</p>
              <p className="text-xs text-muted">Purchases</p>
            </div>
            <div className="rounded-lg bg-vine p-3 text-center">
              <p className="font-mono text-2xl font-bold text-white">{ml.conversion_rate ?? 0}%</p>
              <p className="text-xs text-white/70">Conversion</p>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted">ML service not connected — start the Python service on port 8000</p>
        )}
      </Card>
    </div>
  )
}
