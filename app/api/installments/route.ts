import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPhilSMS } from '@/lib/philsms';

// GET /api/installments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const installments = await prisma.installment.findMany({
      where: userId ? { userId } : {},
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(installments);
  } catch (error) {
    console.error('Installments fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch installments' }, { status: 500 });
  }
}

// POST /api/installments - Create new installment application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const installment = await prisma.installment.create({ data: body });
    return NextResponse.json(installment, { status: 201 });
  } catch (error) {
    console.error('Installment create error:', error);
    return NextResponse.json({ error: 'Failed to create installment' }, { status: 500 });
  }
}

// PATCH /api/installments - Update status (approve/reject/re-pend)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const installment = await prisma.installment.update({
      where: { id },
      data,
    });

    // Send SMS notification on approval or rejection
    if (data.status === 'COMPLETED' || data.status === 'REJECTED') {
      try {
        const customer = await prisma.user.findUnique({
          where: { id: installment.userId },
          select: { phone: true, firstName: true }
        });

        if (customer && customer.phone) {
          let msg = '';
          if (data.status === 'COMPLETED') {
            msg = `Congratulations ${customer.firstName}! Your FrostTech installment application (${installment.appId}) for "${installment.item}" has been APPROVED. We will schedule your installation soon. Thank you for choosing FrostTech!`;
          } else {
            msg = `Hi ${customer.firstName}, we regret to inform you that your FrostTech installment application (${installment.appId}) was not approved at this time. ${installment.issue ? 'Reason: ' + installment.issue : 'Please contact us for more details.'}`;
          }
          await sendPhilSMS(customer.phone, msg);
        }
      } catch (smsError) {
        console.error('Failed to send installment SMS:', smsError);
      }
    }

    return NextResponse.json(installment);
  } catch (error) {
    console.error('Installment update error:', error);
    return NextResponse.json({ error: 'Failed to update installment' }, { status: 500 });
  }
}
