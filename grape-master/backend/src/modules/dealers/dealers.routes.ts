import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { catchAsync } from '../../utils/catchAsync'
import { sendSuccess } from '../../utils/apiResponse'
import { validate } from '../../middleware/validate'

const router = Router()

// Helper: Haversine distance in KM
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// GET /api/dealers/nearest
router.get(
  '/nearest',
  validate(z.object({
    query: z.object({
      latitude: z.coerce.number().optional(),
      longitude: z.coerce.number().optional(),
      pincode: z.string().optional()
    })
  })),
  catchAsync(async (req, res) => {
    const { latitude, longitude, pincode } = req.query as { latitude?: number, longitude?: number, pincode?: string }

    // Fetch all dealers (FertilizerSellerProfile) with their linked user profiles (for coordinates)
    const sellers = await prisma.user.findMany({
      where: { role: 'FERTILIZER_SELLER' },
      include: {
        profile: true,
        sellerProfile: true,
        sellerInventory: {
          include: { product: true }
        }
      }
    })

    const dealers = sellers.map(s => ({
      id: s.sellerProfile?.id || s.id,
      userId: s.id,
      sellerName: s.sellerProfile?.sellerName || s.profile?.fullName || 'Agri Dealer',
      companyName: s.sellerProfile?.companyName || 'Agri Inputs Store',
      user: s
    }))

    if (dealers.length === 0) {
      sendSuccess(res, null, 'No dealers available')
      return
    }

    // Default to the first dealer if no location provided
    if ((!latitude || !longitude) && !pincode) {
      sendSuccess(res, { dealer: dealers[0], distance: 0 }, 'Default dealer assigned (no location provided)')
      return
    }

    let nearestDealer = dealers[0]
    let minDistance = Infinity

    if (latitude && longitude) {
      for (const dealer of dealers) {
        const dLat = dealer.user?.profile?.latitude
        const dLng = dealer.user?.profile?.longitude
        if (dLat && dLng) {
          const dist = getDistanceFromLatLonInKm(latitude, longitude, dLat, dLng)
          if (dist < minDistance) {
            minDistance = dist
            nearestDealer = dealer
          }
        }
      }
    } else if (pincode) {
      const exactMatch = dealers.find(d => d.user?.profile?.pincode === pincode)
      if (exactMatch) {
        nearestDealer = exactMatch
        minDistance = 2
      } else {
        minDistance = 50
      }
    }

    sendSuccess(res, {
      dealer: nearestDealer,
      distance: minDistance === Infinity ? 0 : minDistance
    }, 'Nearest dealer found')
  })
)

// GET /api/dealers/map-users — Returns map pins for all registered MongoDB users
router.get(
  '/map-users',
  catchAsync(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        farmerProfile: true,
        brokerProfile: true,
        sellerProfile: true,
      }
    })

    const districtCoordsMap: Record<string, { lat: number; lng: number }> = {
      nashik: { lat: 20.0063, lng: 73.7898 },
      pune: { lat: 18.5204, lng: 73.8567 },
      sangli: { lat: 16.8524, lng: 74.5815 },
      kolhapur: { lat: 16.7050, lng: 74.2433 },
      satara: { lat: 17.6805, lng: 74.0183 },
      solapur: { lat: 17.6599, lng: 75.9064 },
      ahmednagar: { lat: 19.0948, lng: 74.7480 },
      ahilyanagar: { lat: 19.0948, lng: 74.7480 },
      aurangabad: { lat: 19.8762, lng: 75.3433 },
      sambhajinagar: { lat: 19.8762, lng: 75.3433 },
      nagpur: { lat: 21.1458, lng: 79.0882 },
      amravati: { lat: 20.9374, lng: 77.7796 },
      mumbai: { lat: 19.0760, lng: 72.8777 },
      latur: { lat: 18.4088, lng: 76.5604 },
      nanded: { lat: 19.1383, lng: 77.3210 },
      jalgaon: { lat: 21.0077, lng: 75.5626 },
      dhule: { lat: 20.9042, lng: 74.7749 },
      ratnagiri: { lat: 16.9902, lng: 73.3120 },
    }

    const defaultCoordsList = [
      { lat: 20.0063, lng: 73.7898 }, // Nashik
      { lat: 18.5204, lng: 73.8567 }, // Pune
      { lat: 19.8762, lng: 75.3433 }, // Sambhajinagar
      { lat: 16.8524, lng: 74.5815 }, // Sangli
      { lat: 17.6805, lng: 74.0183 }, // Satara
      { lat: 16.7050, lng: 74.2433 }, // Kolhapur
    ]

    const pins = users.map((u, idx) => {
      const p = u.profile
      const distName = (p?.district || p?.village || '').toLowerCase().trim()
      
      let matched = districtCoordsMap[distName]
      if (!matched && distName) {
        for (const [key, val] of Object.entries(districtCoordsMap)) {
          if (distName.includes(key) || key.includes(distName)) {
            matched = val
            break
          }
        }
      }

      const fallback = defaultCoordsList[idx % defaultCoordsList.length]
      const lat = p?.latitude ?? matched?.lat ?? fallback.lat
      const lng = p?.longitude ?? matched?.lng ?? fallback.lng
      const name = p?.fullName || u.email || 'Registered User'

      let detail = ''
      if (u.role === 'FARMER') detail = `Crop: ${u.farmerProfile?.primaryCrop || 'Produce'} · ${p?.village || p?.district || 'Farm Location'}`
      else if (u.role === 'FERTILIZER_SELLER') detail = `Dealer: ${u.sellerProfile?.sellerName || 'Agri Inputs'} · ${p?.district || 'Market'}`
      else if (u.role === 'BROKER') detail = `Broker Firm: ${u.brokerProfile?.brokerName || 'Trader'} · ${p?.district || 'Market'}`
      else if (u.role === 'CUSTOMER') detail = `Customer · ${p?.village || p?.district || 'Buyer'}`
      else detail = 'System Executive Admin'

      return {
        id: u.id,
        name,
        role: u.role,
        lat,
        lng,
        detail,
      }
    })

    sendSuccess(res, pins, 'Map users retrieved')
  })
)

export default router
