'use client'
import { LayoutDashboard, Users, ShoppingBag, Package, ArrowLeftRight } from 'lucide-react'
import { DashboardShell, type NavItem } from '@/components/DashboardShell'

const nav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" /> },
  { href: '/admin/orders', label: 'Orders', icon: <ShoppingBag className="h-4 w-4" /> },
  { href: '/admin/products', label: 'Products', icon: <Package className="h-4 w-4" /> },
  { href: '/admin/transactions', label: 'Transactions', icon: <ArrowLeftRight className="h-4 w-4" /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="ADMIN" nav={nav}>{children}</DashboardShell>
}
