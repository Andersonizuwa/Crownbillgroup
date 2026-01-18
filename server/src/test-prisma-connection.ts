import prisma from './lib/prisma';

async function testPrisma() {
  console.log('--- Prisma Connection Test ---');
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to the database via Prisma!');
    
    // Optional: try a simple query
    const userCount = await prisma.user.count();
    console.log(`Current user count: ${userCount}`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Prisma connection failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testPrisma();
