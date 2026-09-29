import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/registered-acs?userId=X
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const acs = await prisma.registeredAC.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(acs);
  } catch (error) {
    console.error('Registered ACs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch registered ACs' }, { status: 500 });
  }
}

// POST /api/registered-acs — Register new AC
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, location, brandModel, acType, horsepower, paymentType, totalPrice, months, pricePerMonth, lat, lng, fullAddress, purchasedFromStore } = body;

    if (!userId || !location || !brandModel || !acType || !horsepower || !paymentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ac = await prisma.registeredAC.create({
      data: {
        userId,
        location,
        brandModel,
        acType,
        horsepower,
        paymentType,
        totalPrice: totalPrice || null,
        months: months || null,
        pricePerMonth: pricePerMonth || null,
        lat: lat || null,
        lng: lng || null,
        fullAddress: fullAddress || null,
        purchasedFromStore: purchasedFromStore === true,
      },
    });
    return NextResponse.json(ac, { status: 201 });
  } catch (error) {
    console.error('Register AC error:', error);
    return NextResponse.json({ error: 'Failed to register AC' }, { status: 500 });
  }
}

// DELETE /api/registered-acs?id=X
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    await prisma.registeredAC.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete AC error:', error);
    return NextResponse.json({ error: 'Failed to delete AC' }, { status: 500 });
  }
}

// PATCH /api/registered-acs
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isPaused } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const updated = await prisma.registeredAC.update({
      where: { id },
      data: { isPaused },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update AC error:', error);
    return NextResponse.json({ error: 'Failed to update AC' }, { status: 500 });
  }
}
