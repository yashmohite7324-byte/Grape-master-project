import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('Password123', 10)

  // 1. Purge all seeded products & seller inventories
  await prisma.sellerInventory.deleteMany({})
  await prisma.product.deleteMany({})
  console.log('🗑️  Purged all seeded products & inventory items.')

  // 2. Remove all non-admin accounts so only user created accounts exist
  await prisma.user.deleteMany({
    where: {
      email: { not: 'admin@grapemaster.com' }
    }
  })
  console.log('🗑️  Purged all non-admin demo accounts.')

  // 3. Upsert Master System Admin account ONLY
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@grapemaster.com' },
    update: { password },
    create: {
      email: 'admin@grapemaster.com',
      password,
      role: 'ADMIN',
      profile: {
        create: {
          fullName: 'Master System Admin',
          mobileNumber: '9000000000',
          village: 'Nashik HQ',
          district: 'Nashik',
          state: 'Maharashtra',
          pincode: '422001',
          latitude: 19.9975,
          longitude: 73.7898,
        },
      },
    },
  })

  console.log(`  ✔ MASTER ADMIN LOGINS: email: admin@grapemaster.com | password: Password123`)
  console.log(`  ✔ Admin User ID: ${adminUser.id}`)
}

main()
  .then(() => console.log('\n✅ Database clean seed complete. ONLY admin@grapemaster.com is retained.'))
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
