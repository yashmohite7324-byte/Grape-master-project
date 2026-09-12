'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from './LocationContext'
import { api } from '@/lib/api'

export interface MapUserPin {
  id: string
  name: string
  role: 'FARMER' | 'BROKER' | 'FERTILIZER_SELLER' | 'CUSTOMER' | 'ADMIN'
  lat: number
  lng: number
  detail?: string
}

interface MultiRoleMapProps {
  users?: MapUserPin[]
  centerLat?: number
  centerLng?: number
  zoom?: number
  height?: string
  title?: string
}

const DEFAULT_USERS: MapUserPin[] = [
  { id: '1', name: 'Ramesh Patil (Farmer)', role: 'FARMER', lat: 20.08, lng: 73.95, detail: 'Thompson Seedless Grapes · 1.2 km away' },
  { id: '2', name: 'AgroInputs Ltd (Fertilizer Shop)', role: 'FERTILIZER_SELLER', lat: 20.01, lng: 73.79, detail: 'DAP, Urea, NPK Stock · 2.4 km away' },
  { id: '3', name: 'ABC Traders (Broker Office)', role: 'BROKER', lat: 19.99, lng: 73.78, detail: 'Grape & Produce Broker · 3.1 km away' },
  { id: '4', name: 'Sneha Kulkarni (Customer)', role: 'CUSTOMER', lat: 18.52, lng: 73.85, detail: 'Fresh Produce Buyer · 4.8 km away' },
  { id: '5', name: 'System Admin HQ', role: 'ADMIN', lat: 19.07, lng: 72.87, detail: 'Grape Master Headquarters' },
]

const ROLE_MARKER_CONFIG: Record<string, { color: string; label: string; iconUrl: string; badgeBg: string }> = {
  FARMER: {
    color: '#10b981',
    label: 'Farmer (Crop Produce)',
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  FERTILIZER_SELLER: {
    color: '#3b82f6',
    label: 'Fertilizer Seller (Inputs)',
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  BROKER: {
    color: '#f59e0b',
    label: 'Broker (Trader Network)',
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  CUSTOMER: {
    color: '#8b5cf6',
    label: 'Customer (Fresh Buyer)',
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  ADMIN: {
    color: '#ef4444',
    label: 'Master Admin Hub',
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    badgeBg: 'bg-red-100 text-red-800 border-red-300'
  }
}

export default function MultiRoleMap({
  users,
  centerLat,
  centerLng,
  zoom = 9,
  height = 'h-72'
}: MultiRoleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const locationCtx = useLocation()
  const [mapUsers, setMapUsers] = useState<MapUserPin[]>(users || DEFAULT_USERS)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  // 1. Detect browser GPS location or stored location
  useEffect(() => {
    if (centerLat && centerLng) {
      setUserCoords({ lat: centerLat, lng: centerLng })
      return
    }

    const saved = localStorage.getItem('userLocation')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.latitude && parsed.longitude) {
          setUserCoords({ lat: parsed.latitude, lng: parsed.longitude })
          return
        }
      } catch (e) {}
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {
          setUserCoords({ lat: locationCtx?.location?.latitude ?? 20.04, lng: locationCtx?.location?.longitude ?? 73.85 })
        }
      )
    } else {
      setUserCoords({ lat: locationCtx?.location?.latitude ?? 20.04, lng: locationCtx?.location?.longitude ?? 73.85 })
    }
  }, [centerLat, centerLng, locationCtx])

  // 2. Fetch registered MongoDB users for map pins if not explicitly passed
  useEffect(() => {
    if (users) {
      setMapUsers(users)
      return
    }

    api.get<MapUserPin[]>('/dealers/map-users')
      .then(res => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setMapUsers(res.data)
        }
      })
      .catch(() => {
        setMapUsers(DEFAULT_USERS)
      })
  }, [users])

  // 3. Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAp2BQOaIj6JwUL-6REbncX8KFVo-mnlZs'
    const targetLat = userCoords?.lat ?? 20.04
    const targetLng = userCoords?.lng ?? 73.85

    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`
      script.async = true
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }

    function initMap() {
      if (!mapRef.current || !window.google) return

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: targetLat, lng: targetLng },
        zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      const infoWindow = new window.google.maps.InfoWindow()

      // Add "Your Location" marker if GPS detected
      if (userCoords) {
        const userMarker = new window.google.maps.Marker({
          position: { lat: userCoords.lat, lng: userCoords.lng },
          map,
          title: '📍 You Are Here',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-pushpin.png'
          }
        })
        userMarker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="padding:6px; font-family:sans-serif;">
              <strong style="color:#059669; font-size:13px;">📍 Your Current Location</strong><br/>
              <span style="font-size:11px; color:#555;">GPS Center</span>
            </div>
          `)
          infoWindow.open(map, userMarker)
        })
      }

      mapUsers.forEach(u => {
        const config = ROLE_MARKER_CONFIG[u.role] || ROLE_MARKER_CONFIG.ADMIN
        const marker = new window.google.maps.Marker({
          position: { lat: u.lat, lng: u.lng },
          map,
          title: `${u.name} (${u.role})`,
          icon: {
            url: config.iconUrl
          }
        })

        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="padding:6px; font-family:sans-serif;">
              <strong style="color:${config.color}; font-size:13px;">${u.name}</strong><br/>
              <span style="font-size:11px; color:#555;">Role: ${config.label}</span><br/>
              ${u.detail ? `<span style="font-size:11px; font-weight:600; color:#333;">${u.detail}</span>` : ''}
            </div>
          `)
          infoWindow.open(map, marker)
        })
      })
    }
  }, [mapUsers, userCoords, zoom])

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
      {/* Map Legend Bar with Distinct Colors per Role */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs">
        <span className="font-bold text-slate-800">📍 Google Maps Location Marker Legend:</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Farmer (Green)
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Fertilizer Seller (Blue)
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Broker (Yellow)
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Customer (Purple)
          </span>
        </div>
      </div>

      <div ref={mapRef} className={`${height} w-full bg-slate-100`} />
    </div>
  )
}
