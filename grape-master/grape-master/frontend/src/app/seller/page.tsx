'use client'
import Link from 'next/link'
import { Plus, Package, AlertTriangle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Button, Card, Pill, Spinner, Stat, EmptyState } from '@/components/ui'
import { formatINR, formatDate, statusStyle } from '@/lib/format'
import { getProductImage } from '@/lib/images'
import { useAuth } from '@/lib/auth-store'
import type { Product, Order } from '@/lib/types'

export default function SellerDashboard() {
  const { user } = useAuth()
  const products = useApi(() => api.get<Product[]>('/seller/products', { limit: 100 }).then(r => r.data), [])
  const orders = useApi(() => api.get<Order[]>('/seller/orders', { limit: 100 }).then(r => r.data), [])

  if (products.loading || orders.loading) return <Spinner />
  const prods = products.data ?? []
  const ords = orders.data ?? []
  const revenue = ords.filter(o => o.paymentStatus === 'SUCCESS').reduce((s, o) => s + o.totalAmount, 0)
  const pending = ords.filter(o => ['CONFIRMED','PROCESSING'].includes(o.orderStatus))
  const lowStock = prods.filter(p => (p.inventory?.availableQuantity ?? 0) <= 10)

  const catData = Object.entries(
    prods.reduce((acc: Record<string, number>, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1; return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const COLORS = ['#1F6B4A','#6B3A5B','#B4741F','#5B6660','#3B82F6','#F59E0B']

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0">
          <img src="https://source.unsplash.com/1200x300/?fertilizer,agriculture,warehouse" alt="Seller" className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(124,77,15,0.95) 0%, rgba(180,116,31,0.5) 100%)' }} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between p-6 md:p-8">
          <div>
            <p className="text-xs text-white/60 mb-1 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />Fertilizer seller
            </p>
            <h1 className="font-display text-3xl font-bold text-white">{user?.fullName}</h1>
            <p className="text-white/70 text-sm mt-1">Agricultural input supplier</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/seller/products/new">
              <Button className="bg-white text-harvest font-semibold hover:bg-white/90">
                <Plus className="h-4 w-4" />Add Product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total products', value: prods.length, accent: 'harvest' },
          { label: 'Active products', value: prods.filter(p => p.isActive).length, accent: 'vine' },
          { label: 'Pending orders', value: pending.length, accent: 'danger', link: '/seller/orders' },
          { label: 'Total revenue', value: formatINR(revenue), accent: 'grape' },
        ].map(m => (
          <Link key={m.label} href={m.link ?? '#'} className={m.link ? 'block' : 'pointer-events-none'}>
            <Card className={`p-4 border-l-4 ${
              m.accent === 'harvest' ? 'border-l-harvest' : m.accent === 'vine' ? 'border-l-vine' :
              m.accent === 'danger' ? 'border-l-danger' : 'border-l-grape'
            }`}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">{m.label}</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-ink">{m.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="rounded-xl border border-harvest/40 bg-harvest-soft p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-harvest" />
            <p className="text-sm font-semibold text-harvest">Low stock alert — {lowStock.length} product(s)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <Link key={p.id} href={`/seller/products/${p.id}`}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-harvest/30 px-3 py-1 text-xs text-harvest hover:bg-harvest hover:text-white transition-colors">
                  {p.name} · {p.inventory?.availableQuantity ?? 0} left
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category breakdown pie */}
        {catData.length > 0 && (
          <Card className="p-5">
            <h2 className="font-display text-base font-semibold text-ink mb-4">Products by category</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Products with images */}
        <div className={`${catData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Products</h2>
              <Link href="/seller/products" className="text-xs text-vine hover:underline">Manage all →</Link>
            </div>
            {prods.length === 0 ? (
              <EmptyState icon={<Package className="h-8 w-8" />} title="No products"
                action={<Link href="/seller/products/new"><Button>Add first product</Button></Link>} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {prods.slice(0, 6).map(p => (
                  <Link key={p.id} href={`/seller/products/${p.id}`}>
                    <div className="flex items-center gap-3 rounded-lg border border-line p-3 hover:border-harvest transition-colors">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                        <img src={getProductImage(p.category, p.id, '56x56')} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                        <p className="text-xs text-muted">{p.category}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-vine">{formatINR(p.price)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            (p.inventory?.availableQuantity ?? 0) <= 10 ? 'bg-danger-soft text-danger' : 'bg-vine-soft text-vine-deep'
                          }`}>
                            {p.inventory?.availableQuantity ?? 0} {p.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent orders */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Recent orders</h2>
          <Link href="/seller/orders" className="text-xs text-vine hover:underline">All orders →</Link>
        </div>
        {ords.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No orders yet — share your product catalogue with farmers</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr>{['Order', 'Date', 'Buyer', 'Amount', 'Fulfillment', 'Status'].map(h => (
                <th key={h} className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
              ))}</tr></thead>
              <tbody className="divide-y divide-line">
                {ords.slice(0, 8).map(o => (
                  <tr key={o.id} className="hover:bg-paper/50">
                    <td className="py-2.5 font-mono text-xs text-ink">{o.orderNumber}</td>
                    <td className="py-2.5 text-xs text-muted">{formatDate(o.createdAt)}</td>
                    <td className="py-2.5 text-xs text-ink">{o.buyer?.profile?.fullName ?? '—'}</td>
                    <td className="py-2.5 font-mono text-sm font-semibold text-ink">{formatINR(o.totalAmount)}</td>
                    <td className="py-2.5 text-xs text-muted">{o.fulfillmentMethod}</td>
                    <td className="py-2.5"><Pill className={`${statusStyle[o.orderStatus]} text-[10px]`}>{o.orderStatus.replace('_',' ')}</Pill></td>
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
