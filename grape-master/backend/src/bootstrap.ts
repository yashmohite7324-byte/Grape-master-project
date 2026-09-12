import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function bootstrap() {
  console.log('Bootstrapping company admin account...')

  const email = 'admin@grapemaster.com'
  const hashedPassword = await bcrypt.hash('Password123', 10)

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      profile: {
        create: {
          fullName: 'Grape Master Admin',
          mobileNumber: '9999999999',
          district: 'Nashik',
          state: 'Maharashtra',
        },
      },
    },
  })

  console.log('✅ Company admin account ready!')
  console.log('Email: admin@grapemaster.com')
  console.log('Password: Password123')
}

bootstrap()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
