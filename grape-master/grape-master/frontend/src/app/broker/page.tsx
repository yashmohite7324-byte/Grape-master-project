'use client'
import Link from 'next/link'
import { Store, Plus, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Button, Card, Pill, Spinner, EmptyState } from '@/components/ui'
import { formatQty, formatINR, statusStyle } from '@/lib/format'
import { getCropImage } from '@/lib/images'
import { useAuth } from '@/lib/auth-store'
import type { BrokerOffer, BrokerInventoryItem } from '@/lib/types'

const MOCK_SALES = [
  { name: 'Grapes', value: 52000 }, { name: 'Onion', value: 38000 },
  { name: 'Tomato', value: 27000 }, { name: 'Others', value: 18000 },
]

export default function BrokerDashboard() {
  const { user } = useAuth()
  const offers = useApi(() => api.get<BrokerOffer[]>('/broker/offers', { limit: 100 }).then(r => r.data), [])
  const inventory = useApi(() => api.get<{ items: BrokerInventoryItem[]; summary: any }>('/broker/inventory', { limit: 100 }).then(r => r.data), [])

  if (offers.loading || inventory.loading) return <Spinner />
  const allOffers = offers.data ?? []
  const items = inventory.data?.items ?? []
  const pending = allOffers.filter(o => o.status === 'PENDING')
  const holdingValue = items.reduce((s, i) => s + i.availableQuantity * i.sellingPrice, 0)
  const costValue = items.reduce((s, i) => s + i.availableQuantity * i.purchasePrice, 0)
  const profitPotential = holdingValue - costValue

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0">
          <img src="https://source.unsplash.com/1200x300/?wholesale,market,india" alt="Market" className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(60,15,40,0.95) 0%, rgba(107,58,91,0.6) 100%)' }} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between p-6 md:p-8">
          <div>
            <p className="text-xs text-white/60 mb-1 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />Broker workspace
            </p>
            <h1 className="font-display text-3xl font-bold text-white">{user?.fullName}</h1>
            <p className="text-white/70 text-sm mt-1">Agricultural produce trader</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link href="/broker/marketplace">
              <Button className="bg-white text-grape font-semibold hover:bg-white/90">
                <Store className="h-4 w-4" />Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Offers', value: pending.length, sub: 'waiting for farmer', accent: 'harvest', link: '/broker/offers' },
          { label: 'Inventory Lots', value: items.length, sub: 'lots in stock', accent: 'vine', link: '/broker/inventory' },
          { label: 'Holding Value', value: formatINR(holdingValue), sub: 'at selling prices', accent: 'grape' },
          { label: 'Profit Potential', value: formatINR(profitPotential), sub: 'vs purchase cost', accent: 'ink' },
        ].map(m => (
          <Link key={m.label} href={m.link ?? '#'} className={m.link ? 'block' : 'pointer-events-none'}>
            <Card className={`p-4 border-l-4 ${
              m.accent === 'harvest' ? 'border-l-harvest' : m.accent === 'vine' ? 'border-l-vine' :
              m.accent === 'grape' ? 'border-l-grape' : 'border-l-ink'
            }`}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">{m.label}</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-ink">{m.value}</p>
              <p className="text-xs text-muted">{m.sub}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales by produce chart */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">Sales by Produce</h2>
                <p className="text-xs text-muted">This season · ₹</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-vine font-medium">
                <TrendingUp className="h-3.5 w-3.5" />Growing
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={MOCK_SALES} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatINR(v), 'Sales']} contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {MOCK_SALES.map((_, i) => (
                    <Cell key={i} fill={['#1F6B4A','#6B3A5B','#B4741F','#5B6660'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Inventory table */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Current Inventory</h2>
              <Link href="/broker/inventory" className="text-xs text-vine hover:underline">Manage →</Link>
            </div>
            {items.length === 0 ? (
              <EmptyState icon={<Store className="h-8 w-8" />} title="No inventory"
                hint="Accept farmer offers to build inventory."
                action={<Link href="/broker/marketplace"><Button>Browse marketplace</Button></Link>} />
            ) : (
              <div className="space-y-2">
                {items.slice(0, 5).map(i => (
                  <div key={i.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <img src={getCropImage(i.productName, i.id, '48x48')} alt={i.productName} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{i.productName}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted">Avail: <span className="font-mono text-ink">{formatQty(i.availableQuantity, '')}</span></span>
                        <span className="text-xs text-muted">Cost: <span className="font-mono">{formatINR(i.purchasePrice)}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-base font-bold text-vine">{formatINR(i.sellingPrice)}</p>
                      <p className="text-xs text-vine">+{i.purchasePrice > 0 ? Math.round(((i.sellingPrice - i.purchasePrice)/i.purchasePrice)*100) : 0}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent offers sidebar */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">My Offers</h2>
            <Link href="/broker/offers" className="text-xs text-vine hover:underline">All →</Link>
          </div>
          {allOffers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No offers yet</p>
          ) : (
            <div className="space-y-3">
              {allOffers.slice(0, 6).map(o => (
                <div key={o.id} className="rounded-lg border border-line p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded">
                      <img src={getCropImage(o.listing?.cropType ?? 'Grapes', o.id, '32x32')} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{o.listing?.cropType}</p>
                    </div>
                    <Pill className={`${statusStyle[o.status]} text-[10px]`}>{o.status}</Pill>
                  </div>
                  <p className="font-mono text-sm font-semibold text-ink">{formatINR(o.totalAmount)}</p>
                  <p className="text-xs text-muted">{formatQty(o.quantity, o.listing?.unit ?? '')} @ {formatINR(o.offerPrice)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
