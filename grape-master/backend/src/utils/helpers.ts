/**
 * Generates a unique order number: ORD-YYYYMMDD-XXXXXX
 */
export const generateOrderNumber = (): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD-${date}-${rand}`
}

/**
 * Generates a unique transaction number: TXN-YYYYMMDD-XXXXXX
 */
export const generateTransactionNumber = (): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `TXN-${date}-${rand}`
}

/**
 * Generates a unique receipt number: RCP-YYYYMMDD-XXXXXX
 */
export const generateReceiptNumber = (): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `RCP-${date}-${rand}`
}

/**
 * Calculates delivery charge based on distance (km).
 * Base: ₹30 + ₹8/km
 */
export const calcDeliveryCharge = (distanceKm: number): number => {
  const BASE = 30
  const PER_KM = 8
  return Math.round((BASE + distanceKm * PER_KM) * 100) / 100
}

/**
 * Haversine distance in km between two lat/lng pairs.
 * Used for seller proximity mapping.
 */
export const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
