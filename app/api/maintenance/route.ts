import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/maintenance
export async function GET() {
  try {
    const schedules = await prisma.maintenanceSchedule.findMany({
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        technician: { select: { firstName: true, lastName: true } },
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
    const schedule = await prisma.maintenanceSchedule.create({ data: body });
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
    const schedule = await prisma.maintenanceSchedule.update({
      where: { id },
      data,
    });
    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Maintenance update error:', error);
    return NextResponse.json({ error: 'Failed to update maintenance schedule' }, { status: 500 });
  }
}
