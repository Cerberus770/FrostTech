import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/dispatch
export async function GET() {
  try {
    const items = await prisma.dispatchItem.findMany({
      include: { technician: { select: { firstName: true, lastName: true } } },
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
    const item = await prisma.dispatchItem.create({ data: body });
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
    const { id, ...data } = body;
    const item = await prisma.dispatchItem.update({
      where: { id },
      data,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Dispatch update error:', error);
    return NextResponse.json({ error: 'Failed to update dispatch item' }, { status: 500 });
  }
}
