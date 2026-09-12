'use client'
import { api } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Spinner, Pill, EmptyState, Stat } from '@/components/ui'
import { formatINR, formatDateTime, statusStyle } from '@/lib/format'

interface Transaction {
  id: string; transactionNumber: string; orderId: string
  amount: number; paymentMethod: string; status: string; createdAt: string
  buyer?: { profile: { fullName: string } | null }
  seller?: { profile: { fullName: string } | null }
}

export default function AdminTransactionsPage() {
  const { data, loading, error } = useApi(
    () => api.get<Transaction[]>('/admin/transactions', { limit: 200 }).then(r => r.data), []
  )

  const txns: Transaction[] = Array.isArray(data) ? data : ((data as any)?.items ?? (data as any)?.data ?? [])
  const totalRevenue = txns.filter(t => t.status === 'SUCCESS').reduce((s, t) => s + t.amount, 0)
  const successCount = txns.filter(t => t.status === 'SUCCESS').length

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Transactions</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total transactions" value={txns.length} />
        <Stat label="Successful" value={successCount} />
        <Stat label="Total value" value={formatINR(totalRevenue)} />
      </div>

      {loading ? <Spinner /> : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : txns.length === 0 ? (
        <EmptyState title="No transactions yet" />
      ) : (
        <div className="overflow-auto rounded-card border border-line bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper">
              <tr>{['TXN #', 'Date', 'Buyer', 'Seller', 'Amount', 'Method', 'Status'].map(h => (
                <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {txns.map(t => (
                <tr key={t.id} className="hover:bg-paper/50">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{t.transactionNumber}</td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDateTime(t.createdAt)}</td>
                  <td className="px-4 py-3 text-ink">{t.buyer?.profile?.fullName ?? '—'}</td>
                  <td className="px-4 py-3 text-ink">{t.seller?.profile?.fullName ?? '—'}</td>
                  <td className="px-4 py-3 font-mono font-semibold tabular-nums text-ink">{formatINR(t.amount)}</td>
                  <td className="px-4 py-3 text-muted">{t.paymentMethod}</td>
                  <td className="px-4 py-3"><Pill className={statusStyle[t.status]}>{t.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
