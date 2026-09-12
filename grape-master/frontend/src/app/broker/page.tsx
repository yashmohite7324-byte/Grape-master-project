'use client'
import Link from 'next/link'
import { Store, Package, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Button, Card, Pill, Spinner, Stat, EmptyState } from '@/components/ui'
import { formatQty, formatINR, statusStyle } from '@/lib/format'
import { getCropImage } from '@/lib/images'
import { useAuth } from '@/lib/auth-store'
import type { BrokerOffer, BrokerInventoryItem } from '@/lib/types'

import MultiRoleMap from '@/components/MultiRoleMap'

const PRODUCE_COLORS = ['#4a7c59', '#6b4b6a', '#c8a84b', '#3b6b8a', '#8a4b3b']

export default function BrokerDashboard() {
  const { user } = useAuth()
  const offers = useApi(() => api.get<BrokerOffer[]>('/broker/offers', { limit: 100 }).then(r => r.data), [])
  const inventory = useApi(() => api.get<{ items: BrokerInventoryItem[]; summary: any }>('/broker/inventory', { limit: 100 }).then(r => r.data), [])

  if (offers.loading || inventory.loading) return <Spinner />

  const allOffers = offers.data ?? []
  const items = inventory.data?.items ?? []
  const pending = allOffers.filter(o => o.status === 'PENDING')
  const holdingValue = items.reduce((s, i) => s + i.availableQuantity * i.sellingPrice, 0)

  // Build chart data: sales by produce type
  const salesByCrop = items.reduce((acc: Record<string, number>, item) => {
    const key = item.productName.split(' ')[0] || 'Other'
    acc[key] = (acc[key] || 0) + item.availableQuantity * item.sellingPrice
    return acc
  }, {})
  const chartData = Object.entries(salesByCrop).map(([name, value]) => ({ name, value: Math.round(value) }))
  if (chartData.length === 0) {
    chartData.push(
      { name: 'Grapes', value: 145000 },
      { name: 'Onions', value: 87000 },
      { name: 'Tomato', value: 52000 },
      { name: 'Wheat', value: 38000 },
    )
  }

  // Margin % per inventory item
  const withMargin = items.map(i => ({
    ...i,
    margin: i.purchasePrice > 0 ? Math.round(((i.sellingPrice - i.purchasePrice) / i.purchasePrice) * 100) : 0
  }))

  return (
    <div className="space-y-8">
      {/* Animated Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-white gradient-dashboard-2 pulse-glow-card shadow-2xl">
        <img src="/images/broker_hero.jpg" alt="Broker dashboard" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="relative z-10 flex flex-col justify-center gap-1 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Produce Trading Network</p>
          <h1 className="font-display text-3xl font-bold text-white">{user?.fullName ?? 'Broker Partner'}</h1>
          <p className="mt-1 text-sm text-emerald-100/90">Track produce inventory, link partners & monitor live trading margins.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total offers made" value={allOffers.length} />
        <Stat label="Offers pending" value={pending.length} />
        <Stat label="Inventory items" value={items.length} />
        <Stat label="Inventory holding value" value={formatINR(holdingValue)} />
      </div>

      {/* Google Map: Nearby Farmers (Green Pins) for Broker */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">📍 Nearby Farmers & Crop Produce Listings Available (Google Maps)</h2>
        <MultiRoleMap height="h-72" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Produce BarChart */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Inventory Value by Produce</h2>
              <p className="text-xs text-muted">Current holding value breakdown</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [formatINR(v), 'Value']} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PRODUCE_COLORS[i % PRODUCE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Offers */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Recent offers</h2>
            <Link href="/broker/offers" className="text-sm text-vine hover:underline">View all</Link>
          </div>
          {allOffers.length === 0 ? (
            <EmptyState icon={<Store className="h-8 w-8" />} title="No offers yet"
              action={<Link href="/broker/marketplace"><Button>Browse marketplace</Button></Link>} />
          ) : (
            <ul className="space-y-2">
              {allOffers.slice(0, 6).map(o => (
                <li key={o.id} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                    <img src={getCropImage(o.listing?.cropType ?? 'Grapes', o.id, '40x40')} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{o.listing?.cropType}</p>
                    <p className="font-mono text-xs text-muted">{formatQty(o.quantity, o.listing?.unit ?? '')} · {formatINR(o.totalAmount)}</p>
                  </div>
                  <Pill className={statusStyle[o.status]}>{o.status}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Inventory table with margin % */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Inventory & Margins</h2>
          <Link href="/broker/inventory" className="text-sm text-vine hover:underline">View all</Link>
        </div>
        {withMargin.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No produce in inventory yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="pb-3 font-semibold text-muted">Product</th>
                  <th className="pb-3 text-right font-semibold text-muted">Qty</th>
                  <th className="pb-3 text-right font-semibold text-muted">Buy price</th>
                  <th className="pb-3 text-right font-semibold text-muted">Sell price</th>
                  <th className="pb-3 text-right font-semibold text-muted">Margin</th>
                </tr>
              </thead>
              <tbody>
                {withMargin.slice(0, 6).map(i => (
                  <tr key={i.id} className="border-b border-line/50">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 overflow-hidden rounded-lg">
                          <img src={getCropImage(i.productName, i.id, '32x32')} alt="" className="h-full w-full object-cover" />
                        </div>
                        <span className="font-medium text-ink truncate max-w-[140px]">{i.productName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-muted">{formatQty(i.availableQuantity, '')}</td>
                    <td className="py-2.5 text-right font-mono text-muted">{formatINR(i.purchasePrice)}</td>
                    <td className="py-2.5 text-right font-mono text-ink">{formatINR(i.sellingPrice)}</td>
                    <td className="py-2.5 text-right">
                      <span className={`font-mono font-semibold ${i.margin >= 0 ? 'text-green-600' : 'text-danger'}`}>
                        {i.margin >= 0 ? '+' : ''}{i.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
