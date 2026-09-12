'use client'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, BadgeCheck, Factory, Leaf, MapPinned, PackageCheck, Plus, Sprout, TrendingUp } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Button, Card, Pill, Spinner, Stat, EmptyState } from '@/components/ui'
import { formatINR, formatDate, statusStyle } from '@/lib/format'
import { FERTILIZER_HERO, getProductImage } from '@/lib/images'
import { useAuth } from '@/lib/auth-store'
import type { Product, Order } from '@/lib/types'

import MultiRoleMap from '@/components/MultiRoleMap'

const PIE_COLORS = ['#4a7c59', '#c8a84b', '#6b4b6a', '#3b6b8a', '#8a4b3b', '#2d7a6b']

const sellerHighlights = [
  { label: 'Farmers reached', value: '1,284', icon: <Sprout className="h-4 w-4" /> },
  { label: 'On-time dispatch', value: '96%', icon: <BadgeCheck className="h-4 w-4" /> },
  { label: 'Active SKUs', value: '24', icon: <PackageCheck className="h-4 w-4" /> },
  { label: 'Avg. growth', value: '+18%', icon: <TrendingUp className="h-4 w-4" /> },
]

export default function SellerDashboard() {
  const { user } = useAuth()
  const products = useApi(() => api.get<Product[]>('/seller/products', { limit: 100 }).then(r => r.data), [])
  const orders = useApi(() => api.get<Order[]>('/seller/orders', { limit: 100 }).then(r => r.data), [])

  if (products.loading || orders.loading) return <Spinner />

  const prods = products.data ?? []
  const ords = orders.data ?? []
  const revenue = ords.filter(o => o.paymentStatus === 'SUCCESS').reduce((s, o) => s + o.totalAmount, 0)

  // PieChart data: category breakdown
  const categoryCount = prods.reduce((acc: Record<string, number>, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }))
  if (pieData.length === 0) {
    pieData.push(
      { name: 'DAP', value: 3 }, { name: 'NPK', value: 5 },
      { name: 'UREA', value: 2 }, { name: 'PESTICIDE', value: 4 },
    )
  }

  // Low-stock alerts
  const lowStock = prods.filter(p => (p.inventory?.availableQuantity ?? 0) < 20 && p.isActive)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-[#0a2d1f] via-[#114d38] to-[#7fcb74] shadow-[0_22px_60px_rgba(15,71,41,0.22)]">
        <img src={FERTILIZER_HERO} alt="Fertilizer" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#062a1d]/90 via-[#0d3d2a]/75 to-[#75bb6b]/30" />
        <div className="relative flex flex-col gap-5 p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-100/80">Welcome back</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">{user?.fullName}</h1>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-3 py-2 text-sm text-emerald-50 backdrop-blur-sm">
              <Leaf className="h-4 w-4 text-lime-300" />
              Fertilizer supply dashboard
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {sellerHighlights.map(item => (
              <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-lg shadow-emerald-900/10 backdrop-blur-sm">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-500 text-emerald-900">
                  {item.icon}
                </div>
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="text-sm text-emerald-50/80">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total products" value={prods.length} className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50" />
        <Stat label="Active products" value={prods.filter(p => p.isActive).length} className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50" />
        <Stat label="Total orders" value={ords.length} className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50" />
        <Stat label="Total revenue" value={formatINR(revenue)} className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50" />
      </div>

      {/* Google Map: Nearby Farmers (Green Pins) for Fertilizer Seller */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">📍 Nearby Farmers Needing Fertilizers & Agro Supplies (Google Maps)</h2>
        <MultiRoleMap height="h-72" />
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-amber-800">Low Stock Alerts ({lowStock.length} product{lowStock.length > 1 ? 's' : ''})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <Link key={p.id} href={`/seller/products/${p.id}`}
                className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1 text-sm text-amber-800 hover:border-amber-400 hover:bg-amber-100">
                <span className="font-medium">{p.name}</span>
                <span className="text-amber-500">· {p.inventory?.availableQuantity ?? 0} left</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category PieChart */}
        <Card className="border-emerald-100 p-5">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-ink">Category Breakdown</h2>
            <p className="text-xs text-muted">Products by category</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [v, 'Products']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent orders */}
        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-200">
                <Factory className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-semibold text-ink">Recent orders</h2>
            </div>
            <Link href="/seller/orders"><span className="text-sm font-medium text-emerald-700 hover:underline">View all</span></Link>
          </div>
          {ords.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No orders yet</p>
          ) : (
            <ul className="space-y-3">
              {ords.slice(0, 6).map(o => (
                <li key={o.id}>
                  <Link href={`/seller/orders/${o.id}`} className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2.5 transition-colors hover:border-emerald-300 hover:bg-emerald-50/70">
                    <div>
                      <p className="font-mono text-sm font-semibold text-ink">{o.orderNumber}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <MapPinned className="h-3.5 w-3.5" />
                        {formatDate(o.createdAt)} · {o.fulfillmentMethod}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-ink">{formatINR(o.totalAmount)}</span>
                      <Pill className={`${statusStyle[o.orderStatus]} text-xs`}>{o.orderStatus.replace('_', ' ')}</Pill>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Products grid */}
      <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-lime-400 text-white shadow-md shadow-emerald-200">
              <Leaf className="h-5 w-5" />
            </div>
            <h2 className="font-display text-lg font-semibold text-ink">Products</h2>
          </div>
          <Link href="/seller/products"><span className="text-sm font-medium text-emerald-700 hover:underline">View all</span></Link>
        </div>
        {prods.length === 0 ? (
          <EmptyState title="No products" action={<Link href="/seller/products/new"><Button>Add product</Button></Link>} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {prods.slice(0, 6).map(p => (
              <Link key={p.id} href={`/seller/products/${p.id}`}>
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-2.5 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50">
                    <img src={getProductImage(p.category, p.id, '56x56')} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-muted">{p.category} · {p.inventory?.availableQuantity ?? 0} {p.unit} left</p>
                    <p className="font-mono text-sm font-semibold text-emerald-700">{formatINR(p.price)}</p>
                  </div>
                  <Pill className={p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{p.isActive ? 'Live' : 'Off'}</Pill>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Link href="/seller/products/new"><Button variant="secondary" className="w-full text-sm"><Plus className="h-4 w-4" />Add new product</Button></Link>
        </div>
      </Card>

      {/* CTA */}
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-950 via-emerald-800 to-green-600 p-5 text-white shadow-[0_18px_50px_rgba(8,57,34,0.25)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-emerald-100/80">Farmer support</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Keep your fertilizer stock ready for every season</h2>
          </div>
          <Link href="/seller/products/new" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50">
            Add new input <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
