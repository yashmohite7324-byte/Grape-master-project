'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface UserLocation {
  latitude: number
  longitude: number
  villageOrArea: string
  pincode?: string
}

interface LocationContextType {
  location: UserLocation | null
  setLocation: (loc: UserLocation) => void
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<UserLocation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('userLocation')
    if (saved) {
      try {
        setLocationState(JSON.parse(saved))
      } catch (e) {
        setIsModalOpen(true)
      }
    } else {
      setIsModalOpen(true)
    }
  }, [])

  const setLocation = (loc: UserLocation) => {
    setLocationState(loc)
    localStorage.setItem('userLocation', JSON.stringify(loc))
    setIsModalOpen(false)
  }

  return (
    <LocationContext.Provider value={{ location, setLocation, isModalOpen, setIsModalOpen }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider')
  }
  return context
}
