'use client'
import Link from 'next/link'
import { Plus, TrendingUp, Leaf, Zap, ChevronRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Button, Card, Pill, Spinner, EmptyState } from '@/components/ui'
import { formatQty, formatINR, formatDate, statusStyle } from '@/lib/format'
import { getCropImage, getFarmImage, getProductImage } from '@/lib/images'
import type { FarmerListing, BrokerOffer } from '@/lib/types'
import { useAuth } from '@/lib/auth-store'

const MOCK_PRICE_DATA = [
  { month: 'Mar', price: 72 }, { month: 'Apr', price: 76 }, { month: 'May', price: 74 },
  { month: 'Jun', price: 79 }, { month: 'Jul', price: 82 }, { month: 'Aug', price: 80 },
]

export default function FarmerDashboard() {
  const { user } = useAuth()
  const listings = useApi(() => api.get<FarmerListing[]>('/farmer/listings', { limit: 100 }).then(r => r.data), [])
  const offers = useApi(() => api.get<BrokerOffer[]>('/farmer/offers', { limit: 100 }).then(r => r.data), [])
  const recs = useApi(() => api.get<any[]>('/recommendations', { limit: 6 }).then(r => r.data), [])

  if (listings.loading) return <Spinner label="Loading your farm…" />

  const items = listings.data ?? []
  const allOffers = offers.data ?? []
  const active = items.filter(l => l.status === 'ACTIVE')
  const pending = allOffers.filter(o => o.status === 'PENDING')
  const soldValue = allOffers.filter(o => o.status === 'ACCEPTED').reduce((s, o) => s + o.totalAmount, 0)

  return (
    <div className="space-y-6">
      {/* Hero farm banner */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0">
          <img src={getFarmImage('Nashik', user?.id ?? 'farm')} alt="Farm" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-vine-deep/95 via-vine-deep/70 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between p-6 md:p-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/70 font-medium">Active farmer account</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-white">{user?.fullName ?? 'Farmer'}</h1>
            <p className="text-white/70 text-sm mt-1">Nashik · Maharashtra</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link href="/farmer/listings/new">
              <Button className="bg-white text-vine-deep hover:bg-white/90 font-semibold">
                <Plus className="h-4 w-4" />List Produce
              </Button>
            </Link>
            <Link href="/farmer/marketplace">
              <Button className="bg-vine/40 text-white border border-white/30 hover:bg-vine/60">
                <Leaf className="h-4 w-4" />Buy Inputs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Listings', value: active.length, sub: `${items.length} total`, color: 'vine' },
          { label: 'Pending Offers', value: pending.length, sub: 'awaiting your review', color: 'harvest', link: '/farmer/offers' },
          { label: 'Total Sold Value', value: formatINR(soldValue), sub: 'all time', color: 'grape' },
          { label: 'Success Rate', value: `${items.length > 0 ? Math.round(items.filter(l => l.status === 'SOLD').length / items.length * 100) : 0}%`, sub: 'listings sold', color: 'ink' },
        ].map(m => (
          <Link key={m.label} href={m.link ?? '#'} className={m.link ? 'block' : 'pointer-events-none'}>
            <Card className={`p-4 border-l-4 ${
              m.color === 'vine' ? 'border-l-vine' : m.color === 'harvest' ? 'border-l-harvest' :
              m.color === 'grape' ? 'border-l-grape' : 'border-l-ink'
            }`}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">{m.label}</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-ink">{m.value}</p>
              <p className="text-xs text-muted">{m.sub}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Price trend chart */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">Grape Price Trend</h2>
                <p className="text-xs text-muted">₹/KG — Nashik market average</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-vine font-medium">
                <TrendingUp className="h-3.5 w-3.5" />+11% this season
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={MOCK_PRICE_DATA}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F6B4A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1F6B4A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 90]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={(v: number) => [`₹${v}/KG`, 'Price']} contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="price" stroke="#1F6B4A" fill="url(#priceGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Active listings below chart */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Your active listings</p>
              {active.length === 0 ? (
                <p className="text-sm text-muted py-3 text-center">No active listings — <Link href="/farmer/listings/new" className="text-vine hover:underline">create one</Link></p>
              ) : active.slice(0, 3).map(l => (
                <Link key={l.id} href={`/farmer/listings/${l.id}`}>
                  <div className="flex items-center gap-3 rounded-lg border border-line p-3 hover:border-vine transition-colors">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <img src={getCropImage(l.cropType, l.id, '48x48')} alt={l.cropType} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{l.cropType}{l.variety ? ` · ${l.variety}` : ''}</p>
                      <p className="text-xs text-muted">{formatQty(l.availableQuantity, l.unit)} · {formatINR(l.expectedPrice)}/{l.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(l._count?.brokerOffers ?? 0) > 0 && (
                        <span className="rounded-full bg-harvest-soft px-2 py-0.5 text-xs text-harvest font-medium">
                          {l._count?.brokerOffers} offers
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Pending offers */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Offers Waiting</h2>
              <Link href="/farmer/offers" className="text-xs text-vine hover:underline">View all</Link>
            </div>
            {pending.length === 0 ? (
              <div className="rounded-lg bg-paper p-4 text-center">
                <p className="text-xs text-muted">No pending offers right now.</p>
                <p className="text-xs text-muted mt-1">Check back after listing produce.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.slice(0, 4).map(o => (
                  <Link key={o.id} href="/farmer/offers">
                    <div className="rounded-lg border border-harvest/40 bg-harvest-soft p-3 hover:border-harvest transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 overflow-hidden rounded shrink-0">
                          <img src={getCropImage(o.listing?.cropType ?? 'Grapes', o.id, '32x32')} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink">{o.listing?.cropType}</p>
                          <p className="text-xs text-muted">{formatQty(o.quantity, o.listing?.unit ?? '')}</p>
                        </div>
                      </div>
                      <p className="font-mono text-base font-bold text-harvest">{formatINR(o.totalAmount)}</p>
                      <p className="text-xs text-muted">{formatINR(o.offerPrice)}/{o.listing?.unit}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Weather widget */}
          <Card className="overflow-hidden">
            <div className="relative h-24">
              <img src="https://source.unsplash.com/300x100/?nashik,farm,weather" alt="Weather" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-vine-deep/80 flex items-center justify-between px-4">
                <div>
                  <p className="text-white text-xs">Today · Nashik</p>
                  <p className="text-white font-display text-2xl font-bold">29°C</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-xs">Humidity 78%</p>
                  <p className="text-white/80 text-xs">Good for harvest</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* AI Recommendations */}
      {(recs.data ?? []).length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-grape" />
            <h2 className="font-display text-lg font-semibold text-ink">Recommended for your farm</h2>
            <span className="rounded-full bg-grape-soft px-2.5 py-0.5 text-xs font-medium text-grape">AI-powered</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {(recs.data ?? []).slice(0, 6).map((rec: any) => (
              <Link key={rec.product_id} href="/farmer/marketplace">
                <Card className="overflow-hidden card-hover cursor-pointer group">
                  <div className="relative h-28 overflow-hidden">
                    <img src={getProductImage(rec.category ?? 'OTHER', rec.product_id, '200x112')}
                      alt={rec.product_name} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <span className="rounded-full bg-grape text-white text-[10px] px-1.5 py-0.5 font-semibold">
                        {Math.round(rec.score * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-ink line-clamp-1">{rec.product_name}</p>
                    <p className="text-[10px] text-muted line-clamp-1">{rec.reason}</p>
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
