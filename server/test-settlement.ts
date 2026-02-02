import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    // Test if settlementDetails field exists
    const deposit = await prisma.deposit.findFirst();
    console.log('Deposit fields:', Object.keys(deposit || {}));
    
    // Test update with settlementDetails
    if (deposit) {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          settlementDetails: { test: 'value' }
        }
      });
      console.log('Update successful');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();