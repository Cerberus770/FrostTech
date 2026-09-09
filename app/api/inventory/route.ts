import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/inventory
export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { sku: 'asc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

// POST /api/inventory - Add new item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const item = await prisma.inventoryItem.create({ data: body });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Inventory create error:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}

// PATCH /api/inventory - Update stock
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Inventory update error:', error);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}
