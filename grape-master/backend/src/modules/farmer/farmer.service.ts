import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { toSkipTake, pageMeta, type PageParams } from '../../utils/pagination'
import { createAndSendNotification } from '../../lib/notify'
import type { CreateListingInput, UpdateListingInput } from './farmer.validation'

// ─────────────────────────── Listings ───────────────────────────

/** Create a new produce listing owned by the farmer. */
export const createListing = async (farmerId: string, input: CreateListingInput) => {
  return prisma.farmerListing.create({
    data: {
      farmerId,
      cropType: input.cropType,
      variety: input.variety,
      quantity: input.quantity,
      availableQuantity: input.quantity, // starts fully available
      unit: input.unit,
      expectedPrice: input.expectedPrice,
      harvestDate: input.harvestDate,
      latitude: input.latitude,
      longitude: input.longitude,
      description: input.description,
      images: input.images ?? [],
    },
  })
}

/** List the farmer's own listings, optionally filtered by status. */
export const getMyListings = async (
  farmerId: string,
  page: PageParams,
  status?: 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'CANCELLED'
) => {
  const where: Prisma.FarmerListingWhereInput = { farmerId, ...(status ? { status } : {}) }

  const { skip, take } = toSkipTake(page)

  const [items, total] = await Promise.all([
    prisma.farmerListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { brokerOffers: true } } },
      skip,
      take,
    }),
    prisma.farmerListing.count({ where }),
  ])

  return { items, meta: pageMeta(page, total) }
}

/** Fetch one listing that belongs to this farmer (with its offers). */
export const getMyListing = async (farmerId: string, listingId: string) => {
  const listing = await prisma.farmerListing.findUnique({
    where: { id: listingId },
    include: {
      brokerOffers: {
        orderBy: { createdAt: 'desc' },
        include: { broker: { include: { profile: true, brokerProfile: true } } },
      },
    },
  })
  if (!listing || listing.farmerId !== farmerId) {
    throw AppError.notFound('Listing not found')
  }
  return listing
}

/** Edit a listing. Quantity can only shrink to what is still available. */
export const updateListing = async (
  farmerId: string,
  listingId: string,
  input: UpdateListingInput
) => {
  const listing = await prisma.farmerListing.findUnique({ where: { id: listingId } })
  if (!listing || listing.farmerId !== farmerId) throw AppError.notFound('Listing not found')
  if (listing.status !== 'ACTIVE') {
    throw AppError.badRequest('Only active listings can be edited')
  }

  // If quantity changes, keep availableQuantity consistent with what's already committed.
  let availableQuantity = listing.availableQuantity
  if (input.quantity !== undefined) {
    const soldSoFar = listing.quantity - listing.availableQuantity
    if (input.quantity < soldSoFar) {
      throw AppError.badRequest(
        `Quantity cannot be less than the ${soldSoFar} ${listing.unit} already committed to offers`
      )
    }
    availableQuantity = input.quantity - soldSoFar
  }

  return prisma.farmerListing.update({
    where: { id: listingId },
    data: {
      variety: input.variety,
      expectedPrice: input.expectedPrice,
      description: input.description,
      images: input.images,
      harvestDate: input.harvestDate,
      ...(input.quantity !== undefined ? { quantity: input.quantity, availableQuantity } : {}),
    },
  })
}

/** Cancel a listing (soft state change; also expires its pending offers). */
export const cancelListing = async (farmerId: string, listingId: string) => {
  const listing = await prisma.farmerListing.findUnique({ where: { id: listingId } })
  if (!listing || listing.farmerId !== farmerId) throw AppError.notFound('Listing not found')
  if (listing.status !== 'ACTIVE') throw AppError.badRequest('Listing is not active')

  return prisma.$transaction(async (tx) => {
    await tx.brokerOffer.updateMany({
      where: { listingId, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    })
    return tx.farmerListing.update({
      where: { id: listingId },
      data: { status: 'CANCELLED' },
    })
  })
}

// ─────────────────────────── Offers ───────────────────────────

/** All offers across the farmer's listings (inbox view). */
export const getReceivedOffers = async (farmerId: string, page: PageParams) => {
  const where: Prisma.BrokerOfferWhereInput = { listing: { farmerId } }

  const [items, total] = await Promise.all([
    prisma.brokerOffer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, cropType: true, variety: true, unit: true } },
        broker: { include: { profile: true, brokerProfile: true } },
      },
      ...toSkipTake(page),
    }),
    prisma.brokerOffer.count({ where }),
  ])

  return { items, meta: pageMeta(page, total) }
}

/**
 * Accept a broker offer. This is the pivotal marketplace transaction:
 *   1. validate the offer belongs to the farmer and is still pending
 *   2. ensure the listing still has enough available quantity
 *   3. mark the offer ACCEPTED
 *   4. record a BrokerPurchase
 *   5. deduct the listing's available quantity (mark SOLD if it hits 0)
 *   6. move the produce into the broker's inventory
 * All steps run in one transaction so the ledger can never be left half-updated.
 */
export const acceptOffer = async (farmerId: string, offerId: string) => {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.brokerOffer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    })

    if (!offer || offer.listing.farmerId !== farmerId) {
      throw AppError.notFound('Offer not found')
    }
    if (offer.status !== 'PENDING') {
      throw AppError.conflict('This offer has already been resolved')
    }
    if (offer.listing.status !== 'ACTIVE') {
      throw AppError.conflict('The listing is no longer active')
    }
    if (offer.quantity > offer.listing.availableQuantity) {
      throw AppError.conflict(
        `Only ${offer.listing.availableQuantity} ${offer.listing.unit} remain available`
      )
    }

    // 3. accept
    await tx.brokerOffer.update({ where: { id: offerId }, data: { status: 'ACCEPTED' } })

    // 4. record purchase
    const purchase = await tx.brokerPurchase.create({
      data: {
        brokerId: offer.brokerId,
        offerId: offer.id,
        quantity: offer.quantity,
        purchasePrice: offer.offerPrice,
        totalCost: offer.totalAmount,
      },
    })

    // 5. deduct availability
    const remaining = offer.listing.availableQuantity - offer.quantity
    await tx.farmerListing.update({
      where: { id: offer.listingId },
      data: {
        availableQuantity: remaining,
        status: remaining <= 0 ? 'SOLD' : 'ACTIVE',
      },
    })

    // 6. add to broker inventory (default selling price = 1.4x cost, editable later)
    const inventory = await tx.brokerInventory.create({
      data: {
        brokerId: offer.brokerId,
        purchaseId: purchase.id,
        productName: `${offer.listing.cropType}${offer.listing.variety ? ` (${offer.listing.variety})` : ''}`,
        quantity: offer.quantity,
        availableQuantity: offer.quantity,
        purchasePrice: offer.offerPrice,
        sellingPrice: Math.round(offer.offerPrice * 1.4 * 100) / 100,
      },
    })

    // Notify the broker.
    await createAndSendNotification({
      userId: offer.brokerId,
      title: 'Offer accepted',
      message: `Your offer for ${offer.quantity} ${offer.listing.unit} of ${offer.listing.cropType} was accepted.`,
      type: 'OFFER',
      data: { offerId: offer.id, inventoryId: inventory.id },
      tx
    })

    return { offer: { ...offer, status: 'ACCEPTED' }, purchase, inventory }
  })
}

/** Reject a pending offer. */
export const rejectOffer = async (farmerId: string, offerId: string) => {
  const offer = await prisma.brokerOffer.findUnique({
    where: { id: offerId },
    include: { listing: true },
  })
  if (!offer || offer.listing.farmerId !== farmerId) throw AppError.notFound('Offer not found')
  if (offer.status !== 'PENDING') throw AppError.conflict('This offer has already been resolved')

  const updated = await prisma.brokerOffer.update({
    where: { id: offerId },
    data: { status: 'REJECTED' },
  })

  await createAndSendNotification({
    userId: offer.brokerId,
    title: 'Offer declined',
    message: `Your offer for ${offer.quantity} ${offer.listing.unit} of ${offer.listing.cropType} was declined.`,
    type: 'OFFER',
    data: { offerId: offer.id },
  })

  return updated
}
