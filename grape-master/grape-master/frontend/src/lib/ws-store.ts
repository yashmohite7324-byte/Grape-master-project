'use client'
import { create } from 'zustand'
import { tokenStore } from './api'

export interface RealtimeNotification {
  id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  timestamp: string
  read: boolean
}

interface WSState {
  connected: boolean
  notifications: RealtimeNotification[]
  unreadCount: number
  connect: () => void
  disconnect: () => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
}

let socket: WebSocket | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001'

export const useWS = create<WSState>((set, get) => ({
  connected: false,
  notifications: [],
  unreadCount: 0,

  connect: () => {
    if (typeof window === 'undefined') return
    if (socket?.readyState === WebSocket.OPEN) return

    const token = tokenStore.get()
    if (!token) return

    socket = new WebSocket(`${WS_URL}/ws?token=${encodeURIComponent(token)}`)

    socket.onopen = () => {
      set({ connected: true })
      // Keepalive ping every 25s
      pingInterval = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        }
      }, 25000)
    }

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string)
        if (msg.type === 'pong' || msg.type === 'connected') return

        const notification: RealtimeNotification = {
          id: `${Date.now()}-${Math.random()}`,
          type: msg.type,
          title: msg.title,
          message: msg.message,
          data: msg.data,
          timestamp: new Date().toISOString(),
          read: false,
        }

        set((s) => ({
          notifications: [notification, ...s.notifications].slice(0, 50),
          unreadCount: s.unreadCount + 1,
        }))

        // Browser notification if page is hidden
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, { body: notification.message, icon: '/favicon.ico' })
        }
      } catch { /* ignore parse errors */ }
    }

    socket.onclose = () => {
      set({ connected: false })
      if (pingInterval) clearInterval(pingInterval)
      // Auto-reconnect after 3s
      setTimeout(() => { if (tokenStore.get()) get().connect() }, 3000)
    }

    socket.onerror = () => {
      socket?.close()
    }
  },

  disconnect: () => {
    if (pingInterval) clearInterval(pingInterval)
    socket?.close()
    socket = null
    set({ connected: false, notifications: [], unreadCount: 0 })
  },

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, s.unreadCount - (s.notifications.find(n => n.id === id)?.read ? 0 : 1)),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))
