import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true
      }
    });
    
    console.log('=== USERS IN DATABASE ===');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Full Name: ${user.profile?.fullName || 'N/A'}`);
      console.log(`Created: ${user.createdAt}`);
      console.log('------------------------');
    });
    
    if (users.length === 0) {
      console.log('No users found in database');
    }
    
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();