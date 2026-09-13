import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { toSkipTake, pageMeta, type PageParams } from '../../utils/pagination'
import { createAndSendNotification } from '../../lib/notify'
import type { MakeOfferInput } from './broker.validation'

interface MarketplaceFilters {
  cropType?: string
  variety?: string
  minQuantity?: number
  maxPrice?: number
  district?: string
  state?: string
  sort: 'newest' | 'priceAsc' | 'priceDesc' | 'quantityDesc'
}

const sortMap: Record<MarketplaceFilters['sort'], Prisma.FarmerListingOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  priceAsc: { expectedPrice: 'asc' },
  priceDesc: { expectedPrice: 'desc' },
  quantityDesc: { availableQuantity: 'desc' },
}

// ─────────────────────── Marketplace ───────────────────────

/** Browse active farmer listings that still have quantity available. */
export const browseMarketplace = async (page: PageParams, filters: MarketplaceFilters) => {
  const where: Prisma.FarmerListingWhereInput = {
    ...(filters.cropType
      ? { cropType: { contains: filters.cropType, mode: 'insensitive' } }
      : {}),
    ...(filters.variety ? { variety: { contains: filters.variety, mode: 'insensitive' } } : {}),
    ...(filters.maxPrice ? { expectedPrice: { lte: filters.maxPrice } } : {}),
    ...(filters.district
      ? {
          OR: [
            { farmer: { profile: { district: { contains: filters.district, mode: 'insensitive' } } } },
            { farmer: { profile: { village: { contains: filters.district, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.farmerListing.findMany({
      where,
      orderBy: sortMap[filters.sort] ?? { createdAt: 'desc' },
      include: {
        farmer: {
          include: {
            profile: true,
            farmerProfile: true,
          },
        },
      },
      ...toSkipTake(page),
    }),
    prisma.farmerListing.count({ where }),
  ])

  return { items, meta: pageMeta(page, total) }
}

/** Detail of one marketplace listing. */
export const getMarketplaceListing = async (listingId: string) => {
  const listing = await prisma.farmerListing.findUnique({
    where: { id: listingId },
    include: {
      farmer: {
        select: {
          id: true,
          profile: {
            select: { fullName: true, village: true, district: true, state: true },
          },
          farmerProfile: { select: { primaryCrop: true, farmName: true } },
        },
      },
    },
  })
  if (!listing) throw AppError.notFound('Listing not found')
  return listing
}

// ─────────────────────── Offers ───────────────────────

/**
 * Make an offer on a listing. Validates availability and that the broker
 * hasn't already got a pending offer on the same listing.
 */
export const makeOffer = async (
  brokerId: string,
  listingId: string,
  input: MakeOfferInput
) => {
  const listing = await prisma.farmerListing.findUnique({ where: { id: listingId } })
  if (!listing) throw AppError.notFound('Listing not found')
  if (listing.status !== 'ACTIVE') throw AppError.badRequest('This listing is not active')
  if (input.quantity > listing.availableQuantity) {
    throw AppError.badRequest(
      `Only ${listing.availableQuantity} ${listing.unit} are available`
    )
  }

  const existing = await prisma.brokerOffer.findFirst({
    where: { listingId, brokerId, status: 'PENDING' },
  })
  if (existing) {
    throw AppError.conflict('You already have a pending offer on this listing')
  }

  const totalAmount = Math.round(input.quantity * input.offerPrice * 100) / 100

  const offer = await prisma.brokerOffer.create({
    data: {
      listingId,
      brokerId,
      quantity: input.quantity,
      offerPrice: input.offerPrice,
      totalAmount,
      discountPercent: input.discountPercent ?? 0,
      discountMinQty: input.discountMinQty ?? 0,
      message: input.message,
    },
  })

  // Notify the farmer.
  await createAndSendNotification({
    userId: listing.farmerId,
    title: 'New offer received',
    message: `A broker offered ₹${input.offerPrice}/${listing.unit} for ${input.quantity} ${listing.unit} of ${listing.cropType}.`,
    type: 'OFFER',
    data: { offerId: offer.id, listingId },
  })

  return offer
}

/** The broker's own offers, optionally filtered by status. */
export const getMyOffers = async (
  brokerId: string,
  page: PageParams,
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
) => {
  const where: Prisma.BrokerOfferWhereInput = { brokerId, ...(status ? { status } : {}) }

  const [items, total] = await Promise.all([
    prisma.brokerOffer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            cropType: true,
            variety: true,
            unit: true,
            status: true,
            farmer: { select: { profile: { select: { fullName: true, district: true } } } },
          },
        },
      },
      ...toSkipTake(page),
    }),
    prisma.brokerOffer.count({ where }),
  ])

  return { items, meta: pageMeta(page, total) }
}

/** All active market offers across all farmer listings (visible to all farmers). */
export const getAllPublicOffers = async (page: PageParams) => {
  const [items, total] = await Promise.all([
    prisma.brokerOffer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        broker: {
          select: {
            profile: { select: { fullName: true, district: true } },
            brokerProfile: { select: { companyName: true } },
          },
        },
        listing: {
          select: {
            id: true,
            cropType: true,
            variety: true,
            unit: true,
            expectedPrice: true,
            quantity: true,
            farmer: { select: { profile: { select: { fullName: true, district: true } } } },
          },
        },
      },
      ...toSkipTake(page),
    }),
    prisma.brokerOffer.count(),
  ])

  return { items, meta: pageMeta(page, total) }
}

/** Withdraw a still-pending offer. */
export const withdrawOffer = async (brokerId: string, offerId: string) => {
  const offer = await prisma.brokerOffer.findUnique({ where: { id: offerId } })
  if (!offer || offer.brokerId !== brokerId) throw AppError.notFound('Offer not found')
  if (offer.status !== 'PENDING') throw AppError.conflict('Only pending offers can be withdrawn')

  return prisma.brokerOffer.update({ where: { id: offerId }, data: { status: 'EXPIRED' } })
}

// ─────────────────────── Inventory ───────────────────────

/** All produce the broker currently holds. */
export const getInventory = async (brokerId: string, page: PageParams) => {
  const where: Prisma.BrokerInventoryWhereInput = { brokerId }

  const [items, total] = await Promise.all([
    prisma.brokerInventory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(page),
    }),
    prisma.brokerInventory.count({ where }),
  ])

  // Summary metrics are handy for the dashboard.
  const summary = await prisma.brokerInventory.aggregate({
    where,
    _sum: { availableQuantity: true },
  })

  return {
    items,
    meta: pageMeta(page, total),
    summary: { totalAvailableQuantity: summary._sum.availableQuantity ?? 0 },
  }
}

/** Update the price the broker will sell an inventory item to customers for. */
export const updateSellingPrice = async (
  brokerId: string,
  inventoryId: string,
  sellingPrice: number
) => {
  const item = await prisma.brokerInventory.findUnique({ where: { id: inventoryId } })
  if (!item || item.brokerId !== brokerId) throw AppError.notFound('Inventory item not found')

  return prisma.brokerInventory.update({
    where: { id: inventoryId },
    data: { sellingPrice },
  })
}
