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
      email: testEmail,
      passwordHash: hashedTestPassword,
      roles: {
        create: {
          role: 'user',
        },
      },
      profile: {
        create: {
          email: testEmail,
          fullName: 'Test User',
          kycStatus: 'approved',
          accountStatus: 'active',
        },
      },
      wallet: {
        create: {
          balance: 200,
        },
      },
    },
  });

  console.log('✅ Test user seeded:', testUser.email, '(Balance: $200)');
  console.log('\n🔑 Test User Login:');
  console.log('Email: user@test.com');
  console.log('Password: testpassword123');
  console.log('\n💰 Ready to trade! User has $200 in wallet balance.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });