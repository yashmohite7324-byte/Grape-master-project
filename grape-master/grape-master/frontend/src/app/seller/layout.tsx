'use client'
import { LayoutDashboard, Package, Warehouse, ShoppingBag } from 'lucide-react'
import { DashboardShell, type NavItem } from '@/components/DashboardShell'

const nav: NavItem[] = [
  { href: '/seller', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/seller/products', label: 'Products', icon: <Package className="h-4 w-4" /> },
  { href: '/seller/inventory', label: 'Inventory', icon: <Warehouse className="h-4 w-4" /> },
  { href: '/seller/orders', label: 'Orders', icon: <ShoppingBag className="h-4 w-4" /> },
]

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="FERTILIZER_SELLER" nav={nav}>{children}</DashboardShell>
}
