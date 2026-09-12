'use client'

import { LayoutDashboard, Store, Tag, Package } from 'lucide-react'
import { DashboardShell, type NavItem } from '@/components/DashboardShell'

const nav: NavItem[] = [
  { href: '/broker', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/broker/marketplace', label: 'Marketplace', icon: <Store className="h-4 w-4" /> },
  { href: '/broker/offers', label: 'My offers', icon: <Tag className="h-4 w-4" /> },
  { href: '/broker/inventory', label: 'Inventory', icon: <Package className="h-4 w-4" /> },
]

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="BROKER" nav={nav}>
      {children}
    </DashboardShell>
  )
}
