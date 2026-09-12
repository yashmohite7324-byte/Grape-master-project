'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Search, Filter } from 'lucide-react'

export default function MarketplacePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async (query = '') => {
    setLoading(true)
    try {
      const qs = query ? `?search=${encodeURIComponent(query)}` : ''
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products${qs}`)
      const data = await res.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch products', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts(search)
  }

  return (
    <div className="min-h-screen bg-paper pb-20">
      <header className="bg-ink px-6 py-6 text-white shadow-md">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Marketplace</h1>
            <p className="text-white/70">Discover fertilizers and inputs for your farm</p>
          </div>
          <Link href="/" className="text-sm underline hover:text-vine">Back to Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Search & Filter */}
        <div className="mb-8 flex gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted" />
              <input
                type="text"
                placeholder="Search products, brands, or categories..."
                className="w-full rounded-xl border border-line py-3 pl-10 pr-4 outline-none focus:border-vine"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="rounded-xl bg-vine px-6 font-semibold text-white hover:opacity-90">
              Search
            </button>
          </form>
          <button className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 font-medium text-ink hover:bg-gray-50">
            <Filter className="h-5 w-5" /> Filter
          </button>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-20 text-muted">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted">No products found.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="group overflow-hidden rounded-card border border-line bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400">
                  {p.images?.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-10 w-10 opacity-20" />
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs font-semibold uppercase text-vine">{p.category}</span>
                  <h3 className="mt-1 font-display text-lg font-semibold text-ink line-clamp-1">{p.name}</h3>
                  <p className="mt-1 text-xs text-muted">By {p.seller?.sellerProfile?.sellerName || 'Unknown Seller'}</p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-ink">₹{p.price}</p>
                      <p className="text-xs text-muted">per {p.unit}</p>
                    </div>
                    <Link href={`/login`} className="rounded-lg bg-vine-soft px-3 py-1.5 text-sm font-semibold text-vine hover:bg-vine hover:text-white transition-colors">
                      View details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
