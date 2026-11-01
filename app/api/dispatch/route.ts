import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPhilSMS } from '@/lib/philsms';

// GET /api/dispatch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const items = await prisma.dispatchItem.findMany({
      where: userId ? { customerId: userId } : undefined,
      include: { technicians: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Dispatch fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch dispatch items' }, { status: 500 });
  }
}

// POST /api/dispatch - Create new dispatch entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { technicianIds, ...data } = body;
    const createData: any = { ...data };
    if (technicianIds && Array.isArray(technicianIds) && technicianIds.length > 0) {
      createData.technicians = {
        connect: technicianIds.map((techId: string) => ({ id: techId }))
      };
    }
    const item = await prisma.dispatchItem.create({ data: createData, include: { technicians: true } });

    // Sync to CalendarEvent for assigned technicians
    if (item.scheduledDate && item.technicians && item.technicians.length > 0) {
      const datePart = item.scheduledDate.split(' ')[0];
      for (const tech of item.technicians) {
        const techName = `${tech.firstName} ${tech.lastName}`.trim();
        await prisma.calendarEvent.create({
          data: {
            title: `Dispatch: ${item.type || 'Service'} (${item.name})`,
            date: datePart,
            technician: techName,
            type: item.type || 'job',
          }
        }).catch((e: any) => console.warn('Failed to sync CalendarEvent for dispatch:', e));
      }
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Dispatch create error:', error);
    return NextResponse.json({ error: 'Failed to create dispatch item' }, { status: 500 });
  }
}

// PATCH /api/dispatch - Update dispatch (assign tech, update status)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, technicianIds, ...data } = body;
    
    const updateData: any = { ...data };
    if (technicianIds && Array.isArray(technicianIds)) {
      updateData.technicians = {
        set: technicianIds.map((techId: string) => ({ id: techId }))
      };
    }

    const item = await prisma.dispatchItem.update({
      where: { id },
      data: updateData,
      include: { technicians: true }
    });

    // Sync to CalendarEvent for assigned technicians
    if (item.scheduledDate && item.technicians && item.technicians.length > 0) {
      const datePart = item.scheduledDate.split(' ')[0];
      for (const tech of item.technicians) {
        const techName = `${tech.firstName} ${tech.lastName}`.trim();
        const existing = await prisma.calendarEvent.findFirst({
          where: {
            title: { contains: item.dispatchNo || item.id },
            technician: techName,
          }
        });
        if (!existing) {
          await prisma.calendarEvent.create({
            data: {
              title: `${item.dispatchNo ? item.dispatchNo + ' - ' : ''}${item.type || 'Dispatch'}: ${item.name}`,
              date: datePart,
              technician: techName,
              type: item.type || 'job',
            }
          }).catch((e: any) => console.warn('Failed to sync CalendarEvent:', e));
        }
      }
    }

    // If status is changed to Assigned, send an SMS to the customer
    if (data.status === 'Assigned') {
      try {
        const customer = await prisma.user.findUnique({
          where: { id: item.customerId },
          select: { phone: true, firstName: true }
        });

        if (customer && customer.phone) {
          const techNames = technicianIds ? 'our technicians' : 'your assigned technician';
          const msg = `Hi ${customer.firstName}, your FrostTech service (${item.type}) has been scheduled. ${techNames} will be arriving at your location on ${item.scheduledDate || 'the agreed date'}. Thank you!`;
          
          await sendPhilSMS(customer.phone, msg);
        }
      } catch (smsError) {
        console.error('Failed to send SMS during dispatch:', smsError);
        // We don't throw here to avoid failing the DB update
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Dispatch update error:', error);
    return NextResponse.json({ error: 'Failed to update dispatch item' }, { status: 500 });
  }
}
