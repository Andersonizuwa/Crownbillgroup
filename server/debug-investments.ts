
import { PrismaClient, InvestmentPlan } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const plans = await prisma.investmentPlan.findMany({
        orderBy: { minAmount: 'asc' }
    });

    console.log('--- Current Investment Plans ---');
    plans.forEach((p: InvestmentPlan) => {
        console.log(`[${p.name}] Min: $${p.minAmount}, Max: $${p.maxAmount}, Return: ${p.returnPercentage}%, Duration: ${p.durationDays} days`);
    });
    console.log('--------------------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
