'use client'
import { create } from 'zustand'
import { api, tokenStore } from './api'
import type { AuthUser, Role } from './types'

interface RegisterPayload {
  email: string; password: string; role: Role
  fullName: string; mobileNumber: string
  village?: string; district?: string; state?: string; pincode?: string
  primaryCrop?: string; companyName?: string
}

interface AuthState {
  user: AuthUser | null
  ready: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (payload: RegisterPayload) => Promise<AuthUser>
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,

  login: async (email, password) => {
    const res = await api.post<{ user: AuthUser; token: string }>('/auth/login', { email, password }, false)
    tokenStore.set(res.data.token)
    set({ user: res.data.user })
    return res.data.user
  },

  register: async (payload) => {
    const res = await api.post<{ user: AuthUser; token: string }>('/auth/register', payload, false)
    tokenStore.set(res.data.token)
    set({ user: res.data.user })
    return res.data.user
  },

  logout: () => { tokenStore.clear(); set({ user: null }) },

  hydrate: async () => {
    const token = tokenStore.get()
    if (!token) { set({ ready: true }); return }
    try {
      const res = await api.get<any>('/auth/me')
      set({
        user: {
          id: res.data.id, email: res.data.email, role: res.data.role,
          fullName: res.data.profile?.fullName ?? null,
          mobileNumber: res.data.profile?.mobileNumber ?? null,
        },
        ready: true,
      })
    } catch { tokenStore.clear(); set({ user: null, ready: true }) }
  },
}))

export const homeForRole = (role: Role): string => {
  switch (role) {
    case 'FARMER': return '/farmer'
    case 'BROKER': return '/broker'
    case 'FERTILIZER_SELLER': return '/seller'
    case 'CUSTOMER': return '/customer'
    case 'ADMIN': return '/admin'
    default: return '/'
  }
}
