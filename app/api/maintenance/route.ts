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

    // Augment schedules with computed or stored lastMaintenance date
    const augmentedSchedules = schedules.map((s) => {
      let lastMaintenance: string | null = null;

      // 1. Check for explicit [Last Maint: ...] tag in notes
      const match = s.notes?.match(/\[Last Maint:\s*([^\]]+)\]/i);
      if (match && match[1]) {
        lastMaintenance = match[1].trim();
      } else {
        // 2. Check customer's enrolled AC installation / registration date
        const customerACs = s.customer?.registeredACs || [];
        const matchedAC = customerACs.find(
          (ac) =>
            (ac.brandModel && s.item.toLowerCase().includes(ac.brandModel.toLowerCase())) ||
            (ac.location && s.item.toLowerCase().includes(ac.location.toLowerCase())) ||
            (ac.horsepower && s.item.toLowerCase().includes(ac.horsepower.toLowerCase()))
        ) || (customerACs.length === 1 ? customerACs[0] : null);

        if (matchedAC) {
          const d = matchedAC.enrolledAt || matchedAC.createdAt;
          if (d) {
            try {
              lastMaintenance = new Date(d).toISOString().slice(0, 10);
            } catch {
              lastMaintenance = null;
            }
          }
        }

        // 3. Fallback to Initial Installation / First Service
        if (!lastMaintenance) {
          lastMaintenance = 'First Service (New Unit)';
        }
      }

      // Clean notes to remove raw [Last Maint: ...] tag for clean UI presentation
      const cleanNotes = s.notes ? s.notes.replace(/\[Last Maint:\s*[^\]]+\]\s*/gi, '').trim() : '';

      return {
        ...s,
        notes: cleanNotes,
        lastMaintenance,
      };
    });

    return NextResponse.json(augmentedSchedules);
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

    const { status, lastMaintenance, ...rest } = body;
    const validStatus = status === 'COMPLETED' ? 'COMPLETED' : status === 'OVERDUE' ? 'OVERDUE' : 'SCHEDULED';

    let finalNotes = rest.notes || '';
    if (lastMaintenance) {
      const cleanNotes = finalNotes.replace(/\[Last Maint:\s*[^\]]+\]\s*/gi, '').trim();
      finalNotes = `[Last Maint: ${lastMaintenance.trim()}] ${cleanNotes}`.trim();
    }

    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        ...rest,
        notes: finalNotes,
        customerId,
        status: validStatus,
      },
    });

    return NextResponse.json({
      ...schedule,
      notes: rest.notes || '',
      lastMaintenance: lastMaintenance || 'First Service (New Unit)',
    }, { status: 201 });
  } catch (error) {
    console.error('Maintenance create error:', error);
    return NextResponse.json({ error: 'Failed to create maintenance schedule' }, { status: 500 });
  }
}

// PATCH /api/maintenance - Update maintenance schedule
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, lastMaintenance, ...data } = body;

    // Validate enum status
    if (data.status && data.status !== 'SCHEDULED' && data.status !== 'OVERDUE' && data.status !== 'COMPLETED') {
      delete data.status;
    }

    // Handle lastMaintenance embedding in notes
    if (lastMaintenance !== undefined) {
      const current = await prisma.maintenanceSchedule.findUnique({ where: { id } });
      const baseNotes = (data.notes !== undefined ? data.notes : (current?.notes || '')).replace(/\[Last Maint:\s*[^\]]+\]\s*/gi, '').trim();
      data.notes = lastMaintenance ? `[Last Maint: ${lastMaintenance.trim()}] ${baseNotes}`.trim() : baseNotes;
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

    const cleanNotes = schedule.notes ? schedule.notes.replace(/\[Last Maint:\s*[^\]]+\]\s*/gi, '').trim() : '';
    const match = schedule.notes?.match(/\[Last Maint:\s*([^\]]+)\]/i);

    return NextResponse.json({
      ...schedule,
      notes: cleanNotes,
      lastMaintenance: match ? match[1].trim() : (lastMaintenance || null),
    });
  } catch (error) {
    console.error('Maintenance update error:', error);
    return NextResponse.json({ error: 'Failed to update maintenance schedule' }, { status: 500 });
  }
}
