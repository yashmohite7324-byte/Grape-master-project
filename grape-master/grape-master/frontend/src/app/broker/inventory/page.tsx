'use client'

import { useState } from 'react'
import { Package, Pencil, Check } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/components/Toast'
import { Button, Card, Spinner, EmptyState, Stat } from '@/components/ui'
import { formatINR, formatQty } from '@/lib/format'
import type { BrokerInventoryItem } from '@/lib/types'

interface InventoryResponse {
  items: BrokerInventoryItem[]
  summary: { totalAvailableQuantity: number }
}

export default function BrokerInventoryPage() {
  const { show } = useToast()
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const { data, loading, error, refetch } = useApi(
    () => api.get<InventoryResponse>('/broker/inventory', { limit: 100 }).then((r) => r.data),
    []
  )

  const startEdit = (item: BrokerInventoryItem) =>
    setEditing((e) => ({ ...e, [item.id]: String(item.sellingPrice) }))

  const savePrice = async (id: string) => {
    const price = Number(editing[id])
    if (!price || price <= 0) { show('error', 'Enter a valid price'); return }
    setSaving(id)
    try {
      await api.patch(`/broker/inventory/${id}/price`, { sellingPrice: price })
      show('success', 'Selling price updated')
      setEditing((e) => { const n = { ...e }; delete n[id]; return n })
      refetch()
    } catch (err) {
      show('error', err instanceof ApiError ? err.message : 'Update failed')
    } finally {
      setSaving(null)
    }
  }

  const items = data?.items ?? []
  const holdingValue = items.reduce((s, i) => s + i.availableQuantity * i.sellingPrice, 0)
  const costValue = items.reduce((s, i) => s + i.availableQuantity * i.purchasePrice, 0)

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Inventory</h1>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Lots in stock" value={items.length} />
        <Stat label="Stock value (cost)" value={formatINR(costValue)} />
        <Stat label="Stock value (selling)" value={formatINR(holdingValue)} />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No stock yet"
          hint="When a farmer accepts your offer, the produce lands here for you to price and resell."
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper">
              <tr>
                {['Produce', 'Total qty', 'Available', 'Purchase price', 'Selling price', 'Margin', ''].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((item) => {
                const margin =
                  item.purchasePrice > 0
                    ? (((item.sellingPrice - item.purchasePrice) / item.purchasePrice) * 100).toFixed(1)
                    : '—'
                const isEditing = item.id in editing

                return (
                  <tr key={item.id} className="hover:bg-paper/50">
                    <td className="px-4 py-3 font-medium text-ink">{item.productName}</td>
                    <td className="px-4 py-3 font-mono tabular-nums text-muted">
                      {formatQty(item.quantity, '')}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-ink">
                      {formatQty(item.availableQuantity, '')}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-muted">
                      {formatINR(item.purchasePrice)}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <span className="text-muted">₹</span>
                          <input
                            type="number"
                            className="w-28 rounded border border-vine px-2 py-1 font-mono text-sm text-ink focus:outline-none"
                            value={editing[item.id]}
                            onChange={(e) =>
                              setEditing((ed) => ({ ...ed, [item.id]: e.target.value }))
                            }
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="font-mono tabular-nums text-ink">
                          {formatINR(item.sellingPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-vine">+{margin}%</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Button
                          variant="primary"
                          className="h-8 px-3 text-xs"
                          loading={saving === item.id}
                          onClick={() => savePrice(item.id)}
                        >
                          <Check className="h-3 w-3" />
                          Save
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          className="h-8 px-3 text-xs"
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit price
                        </Button>
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
