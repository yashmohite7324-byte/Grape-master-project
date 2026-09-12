'use client'
import { useState } from 'react'
import { Users } from 'lucide-react'
import { clsx } from 'clsx'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/components/Toast'
import { Spinner, Pill, EmptyState, Button } from '@/components/ui'
import { formatDate, statusStyle } from '@/lib/format'
import type { Role } from '@/lib/types'

const ROLES: (Role | 'ALL')[] = ['ALL', 'FARMER', 'BROKER', 'FERTILIZER_SELLER', 'CUSTOMER', 'ADMIN']

export default function AdminUsersPage() {
  const { show } = useToast()
  const [filter, setFilter] = useState<Role | 'ALL'>('ALL')
  const [toggling, setToggling] = useState<string | null>(null)

  const { data, loading, error, refetch } = useApi(
    () => api.get<any[]>('/admin/users', { role: filter === 'ALL' ? undefined : filter, limit: 200 }).then(r => r.data),
    [filter]
  )

  const toggleActive = async (id: string, active: boolean) => {
    setToggling(id)
    try {
      await api.patch(`/admin/users/${id}`, { isActive: !active })
      show('success', active ? 'User deactivated' : 'User activated')
      refetch()
    } catch (err) { show('error', err instanceof ApiError ? err.message : 'Failed') }
    finally { setToggling(null) }
  }

  const users = data ?? []

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Users</h1>

      <div className="mb-5 flex flex-wrap gap-2">
        {ROLES.map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={clsx('rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              filter === r ? 'bg-vine text-white' : 'border border-line bg-white text-muted hover:border-vine')}>
            {r === 'ALL' ? 'All' : r.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? (
        <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : users.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No users found" />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper">
              <tr>{['Name', 'Email', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-paper/50">
                  <td className="px-4 py-3 font-medium text-ink">{u.profile?.fullName ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3"><Pill className={u.role === 'FARMER' ? 'bg-vine-soft text-vine-deep' : u.role === 'BROKER' ? 'bg-harvest-soft text-harvest' : 'bg-grape-soft text-grape'}>{u.role}</Pill></td>
                  <td className="px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3"><Pill className={u.isActive ? 'bg-vine-soft text-vine-deep' : 'bg-danger-soft text-danger'}>{u.isActive ? 'Active' : 'Inactive'}</Pill></td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" className="h-7 px-2 text-xs"
                      loading={toggling === u.id} onClick={() => toggleActive(u.id, u.isActive)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
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
