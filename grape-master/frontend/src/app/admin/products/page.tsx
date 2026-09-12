'use client'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/components/Toast'
import { Spinner, Pill, EmptyState, Button } from '@/components/ui'
import { formatINR, formatDate } from '@/lib/format'
import type { Product } from '@/lib/types'

export default function AdminProductsPage() {
  const { show } = useToast()
  const { data, loading, error, refetch } = useApi(
    () => api.get<Product[]>('/admin/products', { limit: 200 }).then(r => r.data), []
  )

  const toggle = async (id: string, current: boolean) => {
    try {
      await api.patch(`/admin/products/${id}`, { isActive: !current })
      show('success', current ? 'Product deactivated' : 'Product activated')
      refetch()
    } catch (err) { show('error', err instanceof ApiError ? err.message : 'Failed') }
  }

  const productsList: Product[] = Array.isArray(data) ? data : ((data as any)?.items ?? (data as any)?.data ?? [])

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">All products</h1>

      {loading ? <Spinner /> : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : productsList.length === 0 ? (
        <EmptyState title="No products" />
      ) : (
        <div className="overflow-auto rounded-card border border-line bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper">
              <tr>{['Product', 'Category', 'Seller', 'Price', 'Stock', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {productsList.map((p: Product) => (
                <tr key={p.id} className="hover:bg-paper/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.name}</p>
                    {p.brand && <p className="text-xs text-muted">{p.brand}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category}</td>
                  <td className="px-4 py-3 text-ink">{p.seller?.sellerProfile?.sellerName ?? p.seller?.profile?.fullName ?? '—'}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-ink">{formatINR(p.price)}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-ink">{p.inventory?.availableQuantity ?? 0} {p.unit}</td>
                  <td className="px-4 py-3">
                    <Pill className={p.isActive ? 'bg-vine-soft text-vine-deep' : 'bg-line text-muted'}>
                      {p.isActive ? 'Active' : 'Off'}
                    </Pill>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => toggle(p.id, p.isActive)}>
                      {p.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
