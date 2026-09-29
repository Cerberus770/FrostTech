import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      // Guests are considered new customers
      return NextResponse.json({ isNewCustomer: true });
    }

    // Check if the user has any registered ACs
    const acCount = await prisma.registeredAC.count({
      where: { userId },
    });

    // We can also check if they have any orders for ACs
    const orderCount = await prisma.order.count({
      where: { 
        userId,
        item: {
          contains: 'Inverter', // basic heuristic, assuming ACs have "Inverter" or similar, but registeredAC count is the best proxy
        }
      }
    });

    const isNewCustomer = acCount === 0 && orderCount === 0;

    return NextResponse.json({ isNewCustomer });
  } catch (error) {
    console.error('User status fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch user status' }, { status: 500 });
  }
}
