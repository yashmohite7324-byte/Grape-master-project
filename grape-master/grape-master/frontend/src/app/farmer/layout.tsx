'use client'
import { LayoutDashboard, Sprout, Inbox, ShoppingCart, Leaf } from 'lucide-react'
import { DashboardShell, type NavItem } from '@/components/DashboardShell'

const nav: NavItem[] = [
  { href: '/farmer', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/farmer/listings', label: 'My listings', icon: <Sprout className="h-4 w-4" /> },
  { href: '/farmer/offers', label: 'Offers', icon: <Inbox className="h-4 w-4" /> },
  { href: '/farmer/marketplace', label: 'Buy inputs', icon: <Leaf className="h-4 w-4" /> },
  { href: '/farmer/cart', label: 'Cart', icon: <ShoppingCart className="h-4 w-4" /> },
]

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="FARMER" nav={nav}>{children}</DashboardShell>
}
