import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database cleanup...')

  try {
    // Delete in reverse dependency order to avoid constraint issues, 
    // though MongoDB handles this gracefully with deleteMany.
    await prisma.review.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.recommendation.deleteMany()
    await prisma.userBehavior.deleteMany()
    await prisma.weatherData.deleteMany()
    await prisma.receipt.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.sellerInventory.deleteMany()
    await prisma.product.deleteMany()
    await prisma.brokerInventory.deleteMany()
    await prisma.brokerPurchase.deleteMany()
    await prisma.brokerOffer.deleteMany()
    await prisma.farmerListing.deleteMany()
    await prisma.fertilizerSellerProfile.deleteMany()
    await prisma.brokerProfile.deleteMany()
    await prisma.farmerProfile.deleteMany()
    await prisma.address.deleteMany()
    await prisma.profile.deleteMany()
    await prisma.user.deleteMany()

    console.log('✅ Database completely cleared of all seed data!')
  } catch (error) {
    console.error('Error clearing database:', error)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
