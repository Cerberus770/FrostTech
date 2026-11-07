import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPhilSMS } from '@/lib/philsms';

// Helper: infer appropriate horsepower for dispatch items if missing
function inferHorsepower(itemStr?: string | null, notes?: string | null, type?: string | null): string {
  const combined = `${itemStr || ''} ${notes || ''}`.trim();
  
  // 1. Direct regex match e.g. "1.5 HP", "1.0HP", "2 HP", "0.75 HP", "2.5 HP"
  const match = combined.match(/\b(0\.5|0\.75|1\.0|1\.5|2\.0|2\.5|3\.0|[1-3])\s*HP\b/i);
  if (match) {
    const num = match[1];
    return `${num.includes('.') ? num : num + '.0'} HP`;
  }
  
  const lower = combined.toLowerCase();
  // 2. Known brand/model matches
  if (lower.includes('window')) return '1.0 HP';
  if (lower.includes('floor')) return '2.5 HP';
  if (lower.includes('samsung')) return '1.5 HP';
  if (lower.includes('midea')) return '1.5 HP';
  if (lower.includes('carrier')) return '1.5 HP';
  if (lower.includes('chiq')) return '1.0 HP';
  if (lower.includes('iffalcon')) return '1.0 HP';
  if (lower.includes('tcl')) return '1.0 HP';
  if (lower.includes('daikin')) return '1.5 HP';
  if (lower.includes('panasonic')) return '1.5 HP';
  if (lower.includes('condura')) return '1.5 HP';
  if (lower.includes('split') || lower.includes('inverter')) return '1.5 HP';

  // 3. Standard residential capacity fallback for cleaning/repair/installation
  return '1.5 HP';
}

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

    // Self-healing: if any items are missing horsepower, populate and backfill
    const enrichedItems = items.map((item) => {
      if (!item.horsepower || !item.horsepower.trim()) {
        const hp = inferHorsepower(item.item, item.notes, item.type);
        prisma.dispatchItem.update({
          where: { id: item.id },
          data: { horsepower: hp },
        }).catch(() => {});
        return { ...item, horsepower: hp };
      }
      return item;
    });

    return NextResponse.json(enrichedItems);
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
    
    // Ensure horsepower is always populated
    if (!createData.horsepower || !createData.horsepower.trim()) {
      createData.horsepower = inferHorsepower(createData.item, createData.notes, createData.type);
    }

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

    // If status is changed to COMPLETED, sync and mark linked order as Completed & Settled
    if (data.status === 'COMPLETED') {
      try {
        const orderMatch = item.notes?.match(/Order\s*#?([A-Z0-9-]+)/i);
        if (orderMatch && orderMatch[1]) {
          await prisma.order.updateMany({
            where: { orderNo: orderMatch[1].trim() },
            data: { status: 'Completed', hasDownpayment: true }
          });
        } else if (item.customerId && item.item) {
          await prisma.order.updateMany({
            where: { userId: item.customerId, item: item.item },
            data: { status: 'Completed', hasDownpayment: true }
          });
        }
      } catch (orderSyncErr) {
        console.error('Failed to sync completed dispatch to order:', orderSyncErr);
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Dispatch update error:', error);
    return NextResponse.json({ error: 'Failed to update dispatch item' }, { status: 500 });
  }
}
