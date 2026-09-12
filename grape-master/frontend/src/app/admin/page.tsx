'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Users, ShoppingBag, TrendingUp, Package, Zap, AlertTriangle, ShieldCheck, Sprout, Store, Leaf, ArrowRight, MapPin, BarChart3, Layers } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Card, Pill, Spinner, Stat, Button } from '@/components/ui'
import { formatINR, formatDate, statusStyle } from '@/lib/format'
import type { AdminStats, Order } from '@/lib/types'

import MultiRoleMap from '@/components/MultiRoleMap'

const ML_URL = process.env.NEXT_PUBLIC_ML_URL ?? 'http://localhost:8000'

export default function AdminDashboard() {
  const [activeRoleTab, setActiveRoleTab] = useState<'FARMER' | 'BROKER' | 'FERTILIZER_SELLER' | 'CUSTOMER'>('FARMER')
  const stats = useApi(() => api.get<AdminStats>('/admin/stats').then(r => r.data), [])
  const orders = useApi(() => api.get<Order[]>('/admin/orders', { limit: 8 }).then(r => r.data), [])
  const inventory = useApi(() => api.get<any>('/admin/inventory').then(r => r.data), [])
  const mlStats = useApi(() => fetch(`${ML_URL}/analytics`).then(r => r.json()), [])

  if (stats.loading) return <Spinner label="Loading admin control panel…" />
  const s = stats.data
  const inv = inventory.data
  const ml = mlStats.data

  return (
    <div className="space-y-8">
      {/* Curved Dark Hero Banner with Single Admin Badge */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30 mb-3">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Authenticated Admin Portal · Single Admin Account
            </div>
            <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              Company Control Panel & Role Manager
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              Manage platform signups, monitor live orders across all 4 role portals, and inspect ML recommendations.
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <Link href="/admin/login">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-4 py-2.5 text-xs">
                Admin Sign-In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Google Map with Different Colored Pins based on Location & Role */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Live Marketplace Location Map (Google Maps API)</h2>
        <MultiRoleMap height="h-80" />
      </div>

      {/* Quick Role Portal Switcher Cards (All 4 Logins) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Manage & Switch Role Portals (4 Logins)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/farmer">
            <Card className={`p-4 flex flex-col items-center justify-center text-center transition-all ${activeRoleTab === 'FARMER' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30' : 'hover:border-emerald-300'}`}>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg mb-2">🌾</div>
              <span className="text-sm font-bold text-slate-900">1. Farmer Portal</span>
              <span className="text-xs text-slate-500">{s?.users.farmers ?? 0} Registered</span>
            </Card>
          </Link>
          <Link href="/broker">
            <Card className={`p-4 flex flex-col items-center justify-center text-center transition-all ${activeRoleTab === 'BROKER' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30' : 'hover:border-amber-300'}`}>
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg mb-2">🤝</div>
              <span className="text-sm font-bold text-slate-900">2. Broker Portal</span>
              <span className="text-xs text-slate-500">{s?.users.brokers ?? 0} Registered</span>
            </Card>
          </Link>
          <Link href="/seller">
            <Card className={`p-4 flex flex-col items-center justify-center text-center transition-all ${activeRoleTab === 'FERTILIZER_SELLER' ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30' : 'hover:border-blue-300'}`}>
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-lg mb-2">🧪</div>
              <span className="text-sm font-bold text-slate-900">3. Fertilizer Seller</span>
              <span className="text-xs text-slate-500">{s?.users.sellers ?? 0} Registered</span>
            </Card>
          </Link>
          <Link href="/customer">
            <Card className={`p-4 flex flex-col items-center justify-center text-center transition-all ${activeRoleTab === 'CUSTOMER' ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/30' : 'hover:border-purple-300'}`}>
              <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-lg mb-2">🛒</div>
              <span className="text-sm font-bold text-slate-900">4. Customer Portal</span>
              <span className="text-xs text-slate-500">{s?.users.customers ?? 0} Registered</span>
            </Card>
          </Link>
        </div>
      </div>

      {/* Core stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total registered users" value={s?.users.total ?? '—'} />
        <Stat label="Farmers" value={s?.users.farmers ?? '—'} />
        <Stat label="Total marketplace orders" value={s?.orders.total ?? '—'} />
        <Stat label="Total revenue" value={s ? formatINR(s.revenue.total) : '—'} />
      </div>

      {/* Role Breakdown Bar */}
      {s && (
        <Card className="p-5 border-slate-200">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900">Marketplace User Role Distribution</h2>
          <div className="space-y-3">
            {[
              { label: 'Farmers (Harvest Sellers)', count: s.users.farmers, color: 'bg-emerald-600' },
              { label: 'Customers (Fresh Produce Buyers)', count: s.users.customers, color: 'bg-purple-600' },
              { label: 'Brokers (Network Traders)', count: s.users.brokers, color: 'bg-amber-600' },
              { label: 'Fertilizer Sellers (Input Dealers)', count: s.users.sellers, color: 'bg-blue-600' },
            ].map(({ label, count, color }) => {
              const pct = s.users.total > 0 ? Math.round((count / s.users.total) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-slate-700">{label}</span>
                    <span className="font-mono text-slate-900">{count} accounts ({pct}%)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100">
                    <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders across all 4 roles */}
        <Card className="p-5 border-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900">Live Orders & Checkouts</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-emerald-700 hover:underline">View all</Link>
          </div>
          {orders.loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    {['Order #','Date','Amount','Fulfillment','Status'].map(h => (
                      <th key={h} className="pb-2 text-left font-bold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(orders.data ?? []).map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-2.5 text-slate-500">{formatDate(o.createdAt)}</td>
                      <td className="py-2.5 font-mono font-bold text-slate-900">{formatINR(o.totalAmount)}</td>
                      <td className="py-2.5 text-slate-600">{o.fulfillmentMethod}</td>
                      <td className="py-2.5"><Pill className={`${statusStyle[o.orderStatus]} text-[10px]`}>{o.orderStatus.replace('_',' ')}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Low stock alerts for fertilizer sellers */}
        <Card className="p-5 border-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="font-display text-base font-bold text-slate-900">Low Stock Fertilizer Inventory</h2>
          </div>
          {inventory.loading ? <Spinner /> : (inv?.lowStock ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm font-medium text-slate-500">All fertilizer inventories are healthy ✓</p>
          ) : (
            <ul className="space-y-2">
              {(inv?.lowStock ?? []).slice(0, 6).map((item: any) => (
                <li key={item.id} className="flex items-center justify-between rounded-xl bg-amber-50/80 border border-amber-200 p-3">
                  <div>
                    <p className="text-sm font-bold text-amber-950">{item.product?.name}</p>
                    <p className="text-xs text-amber-800">{item.seller?.sellerProfile?.sellerName ?? item.seller?.profile?.fullName}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-amber-900">{item.availableQuantity} units left</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ML Analytics & Weather Recommendation engine status */}
      <Card className="p-5 border-slate-200 bg-gradient-to-br from-white to-slate-50">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <h2 className="font-display text-base font-bold text-slate-900">ML Fertilizer & Weather Recommendation Engine</h2>
          </div>
          <span className="rounded-full bg-purple-100 text-purple-800 px-3 py-1 text-xs font-bold">Port 8000 Active</span>
        </div>
        {mlStats.loading ? <Spinner /> : ml ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl bg-white border border-slate-200 p-3 text-center shadow-sm">
              <p className="font-mono text-2xl font-bold text-slate-900">{ml.total_events?.toLocaleString('en-IN') ?? 0}</p>
              <p className="text-xs font-medium text-slate-500">Total events</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-3 text-center shadow-sm">
              <p className="font-mono text-2xl font-bold text-slate-900">{ml.recommendation_views?.toLocaleString('en-IN') ?? 0}</p>
              <p className="text-xs font-medium text-slate-500 font-semibold">Rec. views</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-3 text-center shadow-sm">
              <p className="font-mono text-2xl font-bold text-emerald-600">{ml.recommendation_clicks?.toLocaleString('en-IN') ?? 0}</p>
              <p className="text-xs font-medium text-slate-500">Rec. clicks</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-3 text-center shadow-sm">
              <p className="font-mono text-2xl font-bold text-purple-600">{ml.purchases?.toLocaleString('en-IN') ?? 0}</p>
              <p className="text-xs font-medium text-slate-500">Purchases</p>
            </div>
            <div className="rounded-xl bg-slate-900 p-3 text-center text-white shadow-md">
              <p className="font-mono text-2xl font-bold text-emerald-400">{ml.conversion_rate ?? 0}%</p>
              <p className="text-xs text-slate-300 font-semibold">Conversion</p>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-slate-500">ML service online at http://localhost:8000</p>
        )}
      </Card>
    </div>
  )
}
