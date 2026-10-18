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
      include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
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
    const hasDownpayment = !!(body.downpaymentProof || body.hasDownpayment);
    
    const order = await prisma.order.create({
      data: {
        ...body,
        hasDownpayment,
        notice3Days: body.notice3Days ?? false,
        notice3DaysAt: body.notice3Days ? new Date() : null,
      },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Order create error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// PATCH /api/orders - Update order status, notice, or details
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    // If starting 3-day notice, stamp the timestamp
    if (data.notice3Days && !data.notice3DaysAt) {
      data.notice3DaysAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id },
      data,
    });

    // Send SMS notification on order status change
    if (data.status === 'Approved' || data.status === 'Completed' || data.status === 'Cancelled' || data.status === 'Ready for Pick Up' || data.status === 'Picked Up') {
      try {
        const customer = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { phone: true, firstName: true }
        });

        if (customer && customer.phone) {
          let msg = '';
          if (data.status === 'Ready for Pick Up') {
            msg = `Hi ${customer.firstName}! Your FrostTech order (${order.orderNo}) for "${order.item}" is now READY FOR PICK UP at our store. Please present your valid ID upon claiming. Thank you!`;
          } else if (data.status === 'Picked Up') {
            msg = `Hi ${customer.firstName}! Your FrostTech order (${order.orderNo}) has been successfully PICKED UP. Thank you for choosing FrostTech Cooling Solutions!`;
          } else if (data.status === 'Approved') {
            msg = `Hi ${customer.firstName}! Your FrostTech order (${order.orderNo}) for "${order.item}" has been APPROVED. Thank you!`;
          } else if (data.status === 'Cancelled') {
            msg = `Hi ${customer.firstName}! Your FrostTech order (${order.orderNo}) has been CANCELLED.`;
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
