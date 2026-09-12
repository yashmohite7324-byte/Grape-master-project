'use client'
import Link from 'next/link'
import { Plus, Sprout, Inbox, TrendingUp, Leaf, Zap } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Button, Card, Pill, Spinner, Stat, EmptyState } from '@/components/ui'
import { formatQty, formatINR, statusStyle } from '@/lib/format'
import { getCropImage } from '@/lib/images'
import type { FarmerListing, BrokerOffer } from '@/lib/types'
import { useAuth } from '@/lib/auth-store'
import AiFarmerHelper from '@/components/AiFarmerHelper'
import MultiRoleMap from '@/components/MultiRoleMap'

// Fake price-trend data for the chart
const priceTrendData = [
  { month: 'Mar', price: 42 }, { month: 'Apr', price: 48 },
  { month: 'May', price: 45 }, { month: 'Jun', price: 55 },
  { month: 'Jul', price: 60 }, { month: 'Aug', price: 58 },
  { month: 'Sep', price: 65 },
]

export default function FarmerDashboard() {
  const { user } = useAuth()
  const listings = useApi(() => api.get<FarmerListing[]>('/farmer/listings', { limit: 100 }).then(r => r.data), [])
  const offers = useApi(() => api.get<BrokerOffer[]>('/farmer/offers', { limit: 100 }).then(r => r.data), [])
  const recs = useApi(() => api.get<any[]>('/recommendations', { limit: 4 }).then(r => r.data), [])

  if (listings.loading) return <Spinner label="Loading your dashboard…" />

  const items = listings.data ?? []
  const allOffers = offers.data ?? []
  const pending = allOffers.filter(o => o.status === 'PENDING')
  const soldValue = allOffers.filter(o => o.status === 'ACCEPTED').reduce((s, o) => s + o.totalAmount, 0)

  return (
    <div className="space-y-8">
      {/* Mobile-styled Curved Hero Banner (Image 3 style) */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-900 via-green-800 to-emerald-700 p-6 text-white shadow-2xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/30 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" /> Live Market Active
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Hello, {user?.fullName ?? 'Ravi Patil'}! 👋
            </h1>
            <p className="mt-1 max-w-xl text-sm text-emerald-100/90">
              Manage your crop harvest, inspect nearby fertilizer dealers, and connect with verified buyers in real-time.
            </p>

            {/* Nearby Users Avatar Bar (Image 3) */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-emerald-400 ring-2 ring-emerald-900 flex items-center justify-center font-bold text-xs text-emerald-950">RP</div>
                <div className="h-8 w-8 rounded-full bg-amber-400 ring-2 ring-emerald-900 flex items-center justify-center font-bold text-xs text-amber-950">SK</div>
                <div className="h-8 w-8 rounded-full bg-blue-400 ring-2 ring-emerald-900 flex items-center justify-center font-bold text-xs text-blue-950">AT</div>
              </div>
              <span className="text-xs font-medium text-emerald-200">3 nearby dealers & buyers online nearby</span>
            </div>
          </div>

          <div className="flex shrink-0 gap-3">
            <Link href="/farmer/listings/new">
              <Button className="bg-white text-emerald-900 hover:bg-emerald-50 shadow-xl font-bold rounded-2xl px-5 py-3">
                <Plus className="h-4 w-4 mr-1.5" /> List Harvest
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Grid Icons (Image 3 style) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/farmer/listings/new">
          <Card className="p-4 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
              🌾
            </div>
            <span className="text-sm font-bold text-slate-800">Add Product</span>
            <span className="text-[11px] text-slate-500">List grapes & crops</span>
          </Card>
        </Link>
        <Link href="/farmer/marketplace">
          <Card className="p-4 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
              🛒
            </div>
            <span className="text-sm font-bold text-slate-800">Buy Supplies</span>
            <span className="text-[11px] text-slate-500">Fertilizers & DAP</span>
          </Card>
        </Link>
        <Link href="/farmer/marketplace?category=PESTICIDE">
          <Card className="p-4 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
              🧪
            </div>
            <span className="text-sm font-bold text-slate-800">Pesticides</span>
            <span className="text-[11px] text-slate-500">Protection & Spray</span>
          </Card>
        </Link>
        <Link href="/farmer">
          <Card className="p-4 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
              🔍
            </div>
            <span className="text-sm font-bold text-slate-800">Crop Scan</span>
            <span className="text-[11px] text-slate-500">AI Weather & Health</span>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active listings" value={items.filter(l => l.status === 'ACTIVE').length} />
        <Stat label="Pending offers" value={pending.length} />
        <Stat label="Total listings" value={items.length} />
        <Stat label="Total sold value" value={formatINR(soldValue)} />
      </div>

      {/* AI Farmer Helper Widget */}
      <AiFarmerHelper />

      {/* Google Map: Nearby Fertilizer Sellers & Brokers for Farmer */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">📍 Nearby Fertilizer Dealers & Trade Brokers in Your Area (Google Maps API)</h2>
        <MultiRoleMap height="h-72" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Price Trend Chart */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Grape Price Trend</h2>
                <p className="text-xs text-muted">Market price per kg — last 7 months</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-vine-soft px-3 py-1">
                <TrendingUp className="h-3.5 w-3.5 text-vine" />
                <span className="text-xs font-semibold text-vine">+8.3% this month</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={priceTrendData}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a7c59" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4a7c59" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={(v: any) => [`₹${v}/kg`, 'Price']} />
                <Area type="monotone" dataKey="price" stroke="#4a7c59" strokeWidth={2.5} fill="url(#priceGrad)" dot={{ r: 4, fill: '#4a7c59' }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Pending offers */}
        <div>
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Offers waiting</h2>
              <Link href="/farmer/offers" className="text-sm text-vine hover:underline">View all</Link>
            </div>
            {pending.length === 0 ? (
              <div className="py-8 text-center">
                <Inbox className="mx-auto h-8 w-8 text-muted" />
                <p className="mt-2 text-sm text-muted">No pending offers</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {pending.slice(0, 4).map(o => (
                  <li key={o.id} className="rounded-lg bg-harvest-soft p-3">
                    <p className="text-sm font-medium text-ink">{o.listing?.cropType} · {formatQty(o.quantity, o.listing?.unit ?? '')}</p>
                    <p className="font-mono text-sm font-semibold text-harvest">{formatINR(o.totalAmount)}</p>
                    <Link href="/farmer/offers" className="mt-1 text-xs text-vine hover:underline">Review offer →</Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Recent listings */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Recent listings</h2>
          <Link href="/farmer/listings" className="text-sm text-vine hover:underline">View all</Link>
        </div>
        {items.length === 0 ? (
          <EmptyState icon={<Sprout className="h-8 w-8" />} title="No listings yet"
            hint="Post your first harvest to start receiving broker offers."
            action={<Link href="/farmer/listings/new"><Button>Create listing</Button></Link>} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.slice(0, 6).map(l => (
              <Link key={l.id} href={`/farmer/listings/${l.id}`}>
                <div className="flex items-center gap-3 rounded-xl border border-line p-3 hover:border-vine transition-colors hover:shadow-sm">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <img src={getCropImage(l.cropType, l.id, '64x64')} alt={l.cropType} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">{l.cropType}{l.variety ? ` · ${l.variety}` : ''}</p>
                    <p className="text-sm text-muted">{formatQty(l.availableQuantity, l.unit)} available</p>
                    <p className="text-sm font-mono text-vine">{formatINR(l.expectedPrice)}/{l.unit}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs text-muted">{l._count?.brokerOffers ?? 0} offers</span>
                    <Pill className={`mt-1 block ${statusStyle[l.status]}`}>{l.status}</Pill>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* AI Recommendations */}
      {(recs.data ?? []).length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-grape" />
            <h2 className="font-display text-lg font-semibold text-ink">Recommended for your farm</h2>
            <span className="rounded-full bg-grape-soft px-2 py-0.5 text-xs text-grape">AI-powered</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(recs.data ?? []).slice(0, 4).map((rec: any) => (
              <Link key={rec.product_id} href="/farmer/marketplace">
                <Card className="overflow-hidden card-hover group">
                  <div className="h-28 overflow-hidden">
                    <img src="/images/fertilizer_hero.jpg" alt={rec.product_name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-ink truncate">{rec.product_name}</p>
                    <p className="text-xs text-muted">{rec.reason}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-vine">{Math.round(rec.score * 100)}% match</span>
                      <Leaf className="h-3.5 w-3.5 text-vine" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
