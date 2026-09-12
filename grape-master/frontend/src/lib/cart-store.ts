'use client'
import { create } from 'zustand'
import type { Product } from './types'

export interface CartItem {
  product: Product
  quantity: number
  sellerId: string
}

interface CartState {
  items: CartItem[]
  add: (product: Product, qty: number) => void
  remove: (productId: string) => void
  update: (productId: string, qty: number) => void
  clear: () => void
}

export const useCart = create<CartState>((set) => ({
  items: [],
  add: (product, quantity) =>
    set((s) => {
      const exists = s.items.find((i) => i.product.id === product.id)
      if (exists)
        return { items: s.items.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i) }
      return { items: [...s.items, { product, quantity, sellerId: product.sellerId }] }
    }),
  remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),
  update: (productId, quantity) =>
    set((s) => ({ items: s.items.map((i) => i.product.id === productId ? { ...i, quantity } : i) })),
  clear: () => set({ items: [] }),
}))
