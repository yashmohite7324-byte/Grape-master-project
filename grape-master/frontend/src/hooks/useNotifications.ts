'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/lib/auth-store'
import { api } from '@/lib/api'

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  data?: any
  createdAt: string
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOnline, setIsOnline] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  // Load stored notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ items: Notification[] }>('/notifications', { limit: 20 })
      const items = res.data?.items ?? (res.data as any as Notification[]) ?? []
      setNotifications(items)
      setUnreadCount(items.filter((n: Notification) => !n.isRead).length)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const token = typeof window !== 'undefined' ? localStorage.getItem('gm_token') : null
    if (!token) return

    fetchNotifications()

    // Connect socket
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketRef.current = socket

    socket.on('connect', () => setIsOnline(true))
    socket.on('disconnect', () => setIsOnline(false))
    socket.on('connect_error', () => setIsOnline(false))

    socket.on('notification', (data: Notification) => {
      setNotifications(prev => [data, ...prev.slice(0, 49)])
      setUnreadCount(prev => prev + 1)

      // Browser push notification when tab is hidden
      if (document.hidden && Notification.permission === 'granted') {
        new Notification(data.title, { body: data.message, icon: '/favicon.ico' })
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [user, fetchNotifications])

  const markAllRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all', {})
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }, [])

  const requestPushPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return { notifications, unreadCount, isOnline, markAllRead, requestPushPermission, refetch: fetchNotifications }
}
