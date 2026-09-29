import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/addresses?userId=X
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Addresses fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST /api/addresses — Create new address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, label, fullAddress, phone, lat, lng, isDefault } = body;

    if (!userId || !label || !fullAddress || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If this is set as default, unset all other defaults for this user
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label,
        fullAddress,
        phone,
        lat: lat || null,
        lng: lng || null,
        isDefault: isDefault || false,
      },
    });
    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error('Address create error:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}

// DELETE /api/addresses?id=X
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Address delete error:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
