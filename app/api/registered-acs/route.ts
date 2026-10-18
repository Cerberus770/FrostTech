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
    const {
      userId,
      location,
      brandModel,
      acType,
      horsepower,
      paymentType,
      totalPrice,
      months,
      pricePerMonth,
      lat,
      lng,
      fullAddress,
      purchasedFromStore,
      isEnrolledMaintenance,
    } = body;

    if (!userId || !location || !brandModel || !acType || !horsepower) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ac = await prisma.registeredAC.create({
      data: {
        userId,
        location,
        brandModel,
        acType,
        horsepower,
        paymentType: paymentType || 'Cash',
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        months: months ? parseInt(months, 10) : null,
        pricePerMonth: pricePerMonth ? parseFloat(pricePerMonth) : null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        fullAddress: fullAddress || null,
        purchasedFromStore: purchasedFromStore === true,
        isEnrolledMaintenance: isEnrolledMaintenance === true,
        enrolledAt: isEnrolledMaintenance === true ? new Date() : null,
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

// PATCH /api/registered-acs - Update AC info/location/enrollment/status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (updateFields.isEnrolledMaintenance === true && !updateFields.enrolledAt) {
      updateFields.enrolledAt = new Date();
    }

    const updated = await prisma.registeredAC.update({
      where: { id },
      data: updateFields,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update AC error:', error);
    return NextResponse.json({ error: 'Failed to update AC' }, { status: 500 });
  }
}
