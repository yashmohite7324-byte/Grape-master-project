'use client'
import { useState } from 'react'
import { Warehouse, Plus, Minus } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/components/Toast'
import { Button, Card, Spinner, EmptyState, Stat } from '@/components/ui'
import { formatINR } from '@/lib/format'
import type { Product } from '@/lib/types'

export default function SellerInventoryPage() {
  const { show } = useToast()
  const [adjusting, setAdjusting] = useState<Record<string, { qty: string; mode: 'add' | 'remove' }>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const { data, loading, error, refetch } = useApi(
    () => api.get<Product[]>('/seller/products', { limit: 100 }).then(r => r.data), []
  )

  const getInv = (p: Product) => {
    if (!p.inventory) return null
    if (Array.isArray(p.inventory)) return p.inventory[0] ?? null
    return p.inventory
  }

  const products = data ?? []
  const totalStock = products.reduce((s, p) => s + (getInv(p)?.availableQuantity ?? 0), 0)
  const totalValue = products.reduce((s, p) => s + (getInv(p)?.availableQuantity ?? 0) * p.price, 0)

  const startAdjust = (id: string, mode: 'add' | 'remove') =>
    setAdjusting(a => ({ ...a, [id]: { qty: '', mode } }))

  const saveAdjust = async (product: Product) => {
    const adj = adjusting[product.id]
    if (!adj || !adj.qty || Number(adj.qty) <= 0) { show('error', 'Enter a valid quantity'); return }
    setSaving(product.id)
    const inv = getInv(product)
    const targetId = inv?.id || product.id
    try {
      await api.patch(`/seller/inventory/${targetId}`, {
        adjustment: adj.mode === 'add' ? Number(adj.qty) : -Number(adj.qty),
      })
      show('success', 'Stock updated successfully')
      setAdjusting(a => { const n = { ...a }; delete n[product.id]; return n })
      refetch()
    } catch (err) {
      show('error', err instanceof ApiError ? err.message : 'Update failed')
    } finally { setSaving(null) }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Inventory</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Products" value={products.length} />
        <Stat label="Total units in stock" value={totalStock} />
        <Stat label="Stock value" value={formatINR(totalValue)} />
      </div>

      {loading ? <Spinner /> : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : products.length === 0 ? (
        <EmptyState icon={<Warehouse className="h-8 w-8" />} title="No products" hint="Add products first to manage their stock." />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper">
              <tr>
                {['Product', 'Category', 'Price', 'Reserved', 'Available', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map(p => {
                const inv = getInv(p)
                const adj = adjusting[p.id]
                const avail = inv?.availableQuantity ?? 0
                const reserved = inv?.reservedQuantity ?? 0
                return (
                  <tr key={p.id} className="hover:bg-paper/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{p.name}</p>
                      {p.brand && <p className="text-xs text-muted">{p.brand}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted">{p.category}</td>
                    <td className="px-4 py-3 font-mono tabular-nums text-ink">{formatINR(p.price)}</td>
                    <td className="px-4 py-3 font-mono tabular-nums text-muted">{reserved} {p.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold tabular-nums ${avail <= 10 ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {avail} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {adj ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="1" placeholder="Qty"
                            className="w-20 rounded border border-line px-2 py-1 font-mono text-sm focus:border-vine focus:outline-none"
                            value={adj.qty}
                            onChange={e => setAdjusting(a => ({ ...a, [p.id]: { ...a[p.id], qty: e.target.value } }))}
                          />
                          <Button className="h-8 px-3 text-xs" loading={saving === p.id} onClick={() => saveAdjust(p)}>
                            Save
                          </Button>
                          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setAdjusting(a => { const n = { ...a }; delete n[p.id]; return n })}>
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => startAdjust(p.id, 'add')}>
                            <Plus className="h-3 w-3" />Add
                          </Button>
                          <Button variant="ghost" className="h-8 px-2 text-xs text-danger" onClick={() => startAdjust(p.id, 'remove')}>
                            <Minus className="h-3 w-3" />Remove
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
