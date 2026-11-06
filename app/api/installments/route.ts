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
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
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

// PATCH /api/installments - Update status, CI details, or payment tracking
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, customSms, customerPhone, ...data } = body;

    const installment = await prisma.installment.update({
      where: { id },
      data,
    });

    // If custom reminder SMS was requested
    if (customSms && customerPhone) {
      try {
        await sendPhilSMS(customerPhone, customSms);
      } catch (smsErr) {
        console.error('Failed to send custom reminder SMS:', smsErr);
      }
    } else if (
      data.status === 'CI_ACCEPTED' ||
      data.status === 'COMPLETED' ||
      data.status === 'REJECTED'
    ) {
      // Send automatic status update SMS
      try {
        const customer = await prisma.user.findUnique({
          where: { id: installment.userId },
          select: { phone: true, firstName: true },
        });

        const targetPhone = customer?.phone || customerPhone;
        const targetName = customer?.firstName || installment.name || 'Valued Customer';

        if (targetPhone) {
          let msg = '';
          if (data.status === 'CI_ACCEPTED') {
            msg = `Hi ${targetName}! Your FrostTech installment application (${installment.appId}) for "${installment.item}" has been accepted for Credit Investigation (CI). Our verification team will contact you shortly.`;
          } else if (data.status === 'COMPLETED') {
            const schedInfo = data.scheduledDate
              ? ` Installation is scheduled for ${data.scheduledDate}.`
              : '';
            msg = `Congratulations ${targetName}! Your FrostTech installment application (${installment.appId}) for "${installment.item}" has been APPROVED.${schedInfo} Thank you for choosing FrostTech!`;
          } else {
            msg = `Hi ${targetName}, we regret to inform you that your FrostTech installment application (${installment.appId}) was not approved at this time. ${installment.issue ? 'Reason: ' + installment.issue : 'Please contact us for more details.'}`;
          }
          await sendPhilSMS(targetPhone, msg);
        }
      } catch (smsError) {
        console.error('Failed to send installment status SMS:', smsError);
      }
    }

    return NextResponse.json(installment);
  } catch (error) {
    console.error('Installment update error:', error);
    return NextResponse.json({ error: 'Failed to update installment' }, { status: 500 });
  }
}
