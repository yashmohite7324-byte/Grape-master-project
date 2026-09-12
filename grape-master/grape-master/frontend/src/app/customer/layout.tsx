'use client'
import { ShoppingCart, Package, LayoutDashboard } from 'lucide-react'
import { DashboardShell, type NavItem } from '@/components/DashboardShell'

const nav: NavItem[] = [
  { href: '/customer', label: 'Browse', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/customer/cart', label: 'Cart', icon: <ShoppingCart className="h-4 w-4" /> },
  { href: '/customer/orders', label: 'My orders', icon: <Package className="h-4 w-4" /> },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="CUSTOMER" nav={nav}>{children}</DashboardShell>
}
