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

    // Only count approved or completed orders with verified downpayment
    const verifiedOrderCount = await prisma.order.count({
      where: { 
        userId,
        status: { in: ['Approved', 'Completed'] },
        hasDownpayment: true,
      }
    });

    const isNewCustomer = acCount === 0 && verifiedOrderCount === 0;

    return NextResponse.json({ isNewCustomer });
  } catch (error) {
    console.error('User status fetch error:', error);
    return NextResponse.json({ isNewCustomer: true });
  }
}
