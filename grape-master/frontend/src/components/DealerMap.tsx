'use client'

import React, { useEffect, useRef } from 'react'

interface DealerMapProps {
  farmerLat: number
  farmerLng: number
  dealerLat: number
  dealerLng: number
  farmerName?: string
  dealerName?: string
}

export default function DealerMap({
  farmerLat,
  farmerLng,
  dealerLat,
  dealerLng,
  farmerName = 'Your Location',
  dealerName = 'Nearest Dealer'
}: DealerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    // Dynamically load Google Maps script if not already present
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

      const center = {
        lat: (farmerLat + dealerLat) / 2,
        lng: (farmerLng + dealerLng) / 2
      }

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 10,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      // 1. Farmer Marker (Green Pin)
      new window.google.maps.Marker({
        position: { lat: farmerLat, lng: farmerLng },
        map,
        title: farmerName,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }
      })

      // 2. Dealer Marker (Purple/Red Pin)
      new window.google.maps.Marker({
        position: { lat: dealerLat, lng: dealerLng },
        map,
        title: dealerName,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
      })

      // 3. Connect line between Farmer and Dealer
      const path = new window.google.maps.Polyline({
        path: [
          { lat: farmerLat, lng: farmerLng },
          { lat: dealerLat, lng: dealerLng }
        ],
        geodesic: true,
        strokeColor: '#10b981',
        strokeOpacity: 0.8,
        strokeWeight: 4
      })

      path.setMap(map)
    }
  }, [farmerLat, farmerLng, dealerLat, dealerLng, farmerName, dealerName])

  return (
    <div className="overflow-hidden rounded-xl border border-line shadow-sm">
      <div className="flex items-center justify-between bg-paper px-4 py-2 text-xs font-semibold text-ink">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {farmerName} (Green)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> {dealerName} (Red)
        </span>
      </div>
      <div ref={mapRef} className="h-64 w-full bg-slate-100" />
    </div>
  )
}

declare global {
  interface Window {
    google: any
  }
}
