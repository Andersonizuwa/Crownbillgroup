import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test user with $200 balance for trading
  const testEmail = 'user@test.com';
  const testPassword = 'testpassword123';
  const hashedTestPassword = await bcrypt.hash(testPassword, 10);

  const testUser = await prisma.user.upsert({
    where: { email: testEmail },
    update: {},
    create: {
      id: require('uuid').v4(),
      email: testEmail,
      passwordHash: hashedTestPassword,
      updatedAt: new Date(),
      userrole: {
        create: {
          id: require('uuid').v4(),
          role: 'user',
        },
      },
      profile: {
        create: {
          id: require('uuid').v4(),
          email: testEmail,
          fullName: 'Test User',
          kycStatus: 'approved',
          accountStatus: 'active',
          updatedAt: new Date(),
        },
      },
      wallet: {
        create: {
          id: require('uuid').v4(),
          balance: 200,
          updatedAt: new Date(),
        },
      },
    },
  });

  console.log('✅ Test user seeded:', testUser.email, '(Balance: $200)');
  console.log('\n🔑 Test User Login:');
  console.log('Email: user@test.com');
  console.log('Password: testpassword123');
  console.log('\n💰 Ready to trade! User has $200 in wallet balance.');

  // Seed Investment Plans
  const plans = [
    {
      name: 'Bronze Plan',
      description: 'Entry level investment for Crownbill investors. 30 days lock-in.',
      durationDays: 30,
      returnPercentage: 15,
      minAmount: 100,
      maxAmount: 999,
      isActive: true
    },
    {
      name: 'Silver Plan',
      description: 'Solid growth for serious investors. 30 days lock-in.',
      durationDays: 30,
      returnPercentage: 25,
      minAmount: 1000,
      maxAmount: 9999,
      isActive: true
    },
    {
      name: 'Gold Plan',
      description: 'Premium returns for significant capital. 30 days lock-in.',
      durationDays: 30,
      returnPercentage: 40,
      minAmount: 10000,
      maxAmount: 49999,
      isActive: true
    },
    {
      name: 'Platinum Plan (HNI)',
      description: 'Exclusive plan for High Net Worth Individuals. 90 days lock-in for maximum yield.',
      durationDays: 90,
      returnPercentage: 60,
      minAmount: 50000,
      maxAmount: 1000000,
      isActive: true
    },
    {
      name: 'Crownbill Proprietary Trading Algorithm (CBPTA)',
      description: 'Our elite automated trading algorithm. 90 days lock-in with 70% guaranteed returns. 10% profit fee applies.',
      durationDays: 90,
      returnPercentage: 70,
      minAmount: 5000,
      maxAmount: 5000000,
      isActive: true
    }
  ];

  console.log('\n🌱 Seeding investment plans...');
  // Clear existing plans to avoid duplicates and enforce the new structure
  await prisma.investmentPlan.deleteMany({});
  console.log('Cleared existing investment plans.');

  for (const plan of plans) {
    await prisma.investmentPlan.create({
      data: plan
    });
  }
  console.log('✅ Investment plans seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });