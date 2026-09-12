import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('Password123', 10)

  const users = [
    { email: 'admin@grapemaster.com',    role: 'ADMIN' as const,             fullName: 'System Admin' },
    { email: 'farmer@grapemaster.com',   role: 'FARMER' as const,            fullName: 'Ravi Patil' },
    { email: 'broker@grapemaster.com',   role: 'BROKER' as const,            fullName: 'ABC Traders' },
    { email: 'seller@grapemaster.com',   role: 'FERTILIZER_SELLER' as const, fullName: 'AgroInputs Ltd' },
    { email: 'customer@grapemaster.com', role: 'CUSTOMER' as const,          fullName: 'Sneha Kulkarni' },
  ]

  const created: Record<string, string> = {}

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email, password, role: u.role,
        profile: {
          create: {
            fullName: u.fullName, mobileNumber: '9000000000',
            village: 'Ozar', district: 'Nashik', state: 'Maharashtra',
            pincode: '422206', latitude: 20.08, longitude: 73.95,
          },
        },
        ...(u.role === 'FARMER'            && { farmerProfile: { create: { primaryCrop: 'Grapes', farmName: 'Patil Vineyard' } } }),
        ...(u.role === 'BROKER'            && { brokerProfile: { create: { brokerName: u.fullName, companyName: 'ABC Traders Pvt Ltd' } } }),
        ...(u.role === 'FERTILIZER_SELLER' && { sellerProfile: { create: { sellerName: u.fullName, companyName: 'AgroInputs Ltd' } } }),
      },
    })
    created[u.role] = user.id
    console.log(`  ✔ ${u.role.padEnd(18)} ${u.email}`)
  }

  // ── Seed demo products for the seller ──
  const sellerId = created['FERTILIZER_SELLER']
  if (sellerId) {
    const products = [
      { name: 'DAP Fertilizer',        category: 'DAP',          brand: 'IFFCO',    unit: 'BAG',  price: 1350, stock: 120 },
      { name: 'Urea',                  category: 'UREA',         brand: 'KRIBHCO',  unit: 'BAG',  price: 266,  stock: 200 },
      { name: 'NPK 10-26-26',          category: 'NPK',          brand: 'Coromandel', unit: 'BAG', price: 1450, stock: 80 },
      { name: 'Potash (MOP)',          category: 'MOP',          brand: 'IPL',       unit: 'BAG',  price: 1600, stock: 50 },
      { name: 'Micronutrient Mix',     category: 'MICRONUTRIENT', brand: 'Multiplex', unit: 'KG', price: 380,  stock: 40 },
      { name: 'Carbendazim Fungicide', category: 'FUNGICIDE',    brand: 'UPL',       unit: 'KG',  price: 420,  stock: 30 },
    ]

    for (const p of products) {
      const existing = await prisma.product.findFirst({
        where: { sellerId, name: p.name },
      })
      if (!existing) {
        const product = await prisma.product.create({
          data: { sellerId, name: p.name, category: p.category, brand: p.brand, unit: p.unit, price: p.price, productType: 'FERTILIZER' },
        })
        await prisma.sellerInventory.create({
          data: { sellerId, productId: product.id, quantity: p.stock, availableQuantity: p.stock },
        })
        console.log(`  ✔ Product         ${p.name}`)
      }
    }
  }

  // ── Seed demo farmer listing ──
  const farmerId = created['FARMER']
  if (farmerId) {
    const existing = await prisma.farmerListing.findFirst({ where: { farmerId } })
    if (!existing) {
      await prisma.farmerListing.create({
        data: {
          farmerId, cropType: 'Grapes', variety: 'Thompson Seedless',
          quantity: 500, availableQuantity: 500, unit: 'KG',
          expectedPrice: 80, harvestDate: new Date('2026-10-01'),
          description: 'Export-quality seedless grapes from Nashik.',
          latitude: 20.08, longitude: 73.95,
        },
      })
      console.log('  ✔ Listing          Demo grape listing')
    }
  }
}

main()
  .then(() => console.log('\n✅ Seed complete. Password for all demo users: Password123'))
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
