import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPhilSMS } from '@/lib/philsms';

// GET /api/orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const orders = await prisma.order.findMany({
      where: userId ? { userId } : {},
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const order = await prisma.order.create({ data: body });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Order create error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// PATCH /api/orders - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const order = await prisma.order.update({
      where: { id },
      data,
    });

    // Send SMS notification on order status change
    if (data.status === 'Approved' || data.status === 'Completed') {
      try {
        const customer = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { phone: true, firstName: true }
        });

        if (customer && customer.phone) {
          let msg = '';
          if (data.status === 'Approved') {
            msg = `Hi ${customer.firstName}! Your FrostTech order (${order.orderNo}) for "${order.item}" has been APPROVED and is now being processed. We'll update you once it's ready. Thank you!`;
          } else {
            msg = `Hi ${customer.firstName}! Your FrostTech order (${order.orderNo}) has been COMPLETED. Thank you for choosing FrostTech Cooling Solutions!`;
          }
          await sendPhilSMS(customer.phone, msg);
        }
      } catch (smsError) {
        console.error('Failed to send order SMS:', smsError);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
