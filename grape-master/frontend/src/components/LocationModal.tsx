'use client'

import React, { useState } from 'react'
import { useLocation } from './LocationContext'
import { MapPin, Navigation } from 'lucide-react'

export default function LocationModal() {
  const { isModalOpen, setLocation, setIsModalOpen } = useLocation()
  const [village, setVillage] = useState('')
  const [pincode, setPincode] = useState('')
  const [loadingGps, setLoadingGps] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isModalOpen) return null

  const handleGps = () => {
    setLoadingGps(true)
    setError(null)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            villageOrArea: village || 'Current Location (GPS)',
            pincode: pincode || undefined
          })
          setLoadingGps(false)
        },
        (err) => {
          setError('Could not fetch GPS location. Please enter your Village/Pincode manually.')
          setLoadingGps(false)
        }
      )
    } else {
      setError('Geolocation is not supported by your browser.')
      setLoadingGps(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!village && !pincode) {
      setError('Please provide at least a Village/Area or Pincode')
      return
    }

    // Default coordinates if manual pincode/area entered (e.g. Pune/Nashik approximations)
    let defaultLat = 18.5204 // Pune approx
    let defaultLng = 73.8567
    if (pincode.startsWith('422')) {
      defaultLat = 19.9975 // Nashik approx
      defaultLng = 73.7898
    }

    setLocation({
      latitude: defaultLat,
      longitude: defaultLng,
      villageOrArea: village || `Pincode ${pincode}`,
      pincode: pincode || undefined
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-card bg-white p-6 shadow-2xl ring-1 ring-black/5 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-vine-soft text-vine-deep">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Select Your Location</h2>
            <p className="text-xs text-muted">Identify your area to assign the nearest dealer & delivery fees.</p>
          </div>
        </div>

        <button
          onClick={handleGps}
          disabled={loadingGps}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-vine-deep py-3 font-semibold text-white transition hover:bg-vine-deep/90 disabled:opacity-50"
        >
          <Navigation className="h-4 w-4" />
          {loadingGps ? 'Fetching GPS...' : 'Use Current GPS Location'}
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-line" />
          <span>OR ENTER MANUALLY</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-ink">Village / Area Name</label>
            <input
              type="text"
              placeholder="e.g. Baramati, Pimpalgaon"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vine"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink">Pincode (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 411001 or 422003"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vine"
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-ink py-2.5 font-medium text-white transition hover:bg-ink/90"
          >
            Save Location & Continue
          </button>
        </form>
      </div>
    </div>
  )
}
