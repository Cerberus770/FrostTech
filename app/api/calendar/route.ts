import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/calendar?technician=X&date=Y
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const technician = searchParams.get('technician');
    const date = searchParams.get('date');

    const where: any = {};
    if (technician) {
      where.technician = { contains: technician, mode: 'insensitive' };
    }
    if (date) {
      where.date = date;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Calendar events fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

// POST /api/calendar - Create new calendar event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, date, technician, type = 'job' } = body;

    if (!title || !date || !technician) {
      return NextResponse.json({ error: 'title, date, and technician are required' }, { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        date,
        technician,
        type,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Calendar event create error:', error);
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
}

// DELETE /api/calendar?id=X
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar event delete error:', error);
    return NextResponse.json({ error: 'Failed to delete calendar event' }, { status: 500 });
  }
}
