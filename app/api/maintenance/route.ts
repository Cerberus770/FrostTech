import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/maintenance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const schedules = await prisma.maintenanceSchedule.findMany({
      where: userId ? { customerId: userId } : {},
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            registeredACs: true,
          },
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            techRank: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Maintenance fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance schedules' }, { status: 500 });
  }
}

// POST /api/maintenance - Create new maintenance schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Ensure customerId points to a valid user in database
    let customerId = body.customerId;
    if (customerId) {
      const userExists = await prisma.user.findUnique({ where: { id: customerId } });
      if (!userExists) {
        const fallbackUser = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } }) || await prisma.user.findFirst();
        if (fallbackUser) customerId = fallbackUser.id;
      }
    } else {
      const fallbackUser = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } }) || await prisma.user.findFirst();
      if (fallbackUser) customerId = fallbackUser.id;
    }

    const { status, ...rest } = body;
    const validStatus = status === 'COMPLETED' ? 'COMPLETED' : status === 'OVERDUE' ? 'OVERDUE' : 'SCHEDULED';

    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        ...rest,
        customerId,
        status: validStatus,
      },
    });
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Maintenance create error:', error);
    return NextResponse.json({ error: 'Failed to create maintenance schedule' }, { status: 500 });
  }
}

// PATCH /api/maintenance - Update maintenance schedule
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    // Validate enum status
    if (data.status && data.status !== 'SCHEDULED' && data.status !== 'OVERDUE' && data.status !== 'COMPLETED') {
      delete data.status;
    }

    const schedule = await prisma.maintenanceSchedule.update({
      where: { id },
      data,
    });

    // If a technician is being assigned, send an SMS to the customer
    if (data.technicianId) {
      try {
        const customer = await prisma.user.findUnique({
          where: { id: schedule.customerId },
          select: { phone: true, firstName: true }
        });

        if (customer && customer.phone && customer.phone !== 'N/A') {
          const { sendPhilSMS } = await import('@/lib/philsms');
          const msg = `Hi ${customer.firstName}, your FrostTech AC maintenance (${schedule.serviceType}) has been scheduled. Your assigned tech (${data.technicianName}) will arrive on ${schedule.scheduledDate}. Thank you!`;
          await sendPhilSMS(customer.phone, msg);
          console.log(`[MAINTENANCE] SMS sent to ${customer.phone} for schedule ${schedule.scheduleNo}`);
        }
      } catch (smsError) {
        console.error('Failed to send SMS during maintenance tech assignment:', smsError);
      }
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Maintenance update error:', error);
    return NextResponse.json({ error: 'Failed to update maintenance schedule' }, { status: 500 });
  }
}
