import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Self-healing schema helper for Neon PostgreSQL
let schemaChecked = false;
async function ensureSchema() {
  if (schemaChecked) return;
  try {
    // 1. Create table if missing
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "registered_acs" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "location" TEXT,
        "brandModel" TEXT NOT NULL,
        "acType" TEXT NOT NULL,
        "horsepower" TEXT NOT NULL,
        "yearAcquired" TEXT,
        "paymentType" TEXT DEFAULT 'Manual Add',
        "totalPrice" DOUBLE PRECISION,
        "months" INTEGER,
        "pricePerMonth" DOUBLE PRECISION,
        "lat" DOUBLE PRECISION,
        "lng" DOUBLE PRECISION,
        "fullAddress" TEXT,
        "purchasedFromStore" BOOLEAN DEFAULT false,
        "isPaused" BOOLEAN DEFAULT false,
        "isEnrolledMaintenance" BOOLEAN DEFAULT false,
        "enrolledAt" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'Active',
        "installedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastServiceDate" TIMESTAMP(3),
        "nextServiceDue" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Ensure all columns exist and location is nullable
    const migrations = [
      `ALTER TABLE "registered_acs" ADD COLUMN IF NOT EXISTS "yearAcquired" TEXT;`,
      `ALTER TABLE "registered_acs" ADD COLUMN IF NOT EXISTS "purchasedFromStore" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "registered_acs" ADD COLUMN IF NOT EXISTS "isPaused" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "registered_acs" ADD COLUMN IF NOT EXISTS "isEnrolledMaintenance" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "registered_acs" ADD COLUMN IF NOT EXISTS "enrolledAt" TIMESTAMP(3);`,
      `ALTER TABLE "registered_acs" ADD COLUMN IF NOT EXISTS "fullAddress" TEXT;`,
      `ALTER TABLE "registered_acs" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;`,
      `ALTER TABLE "registered_acs" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;`,
      `ALTER TABLE "registered_acs" ALTER COLUMN "location" DROP NOT NULL;`,
    ];

    for (const ddl of migrations) {
      try {
        await prisma.$executeRawUnsafe(ddl);
      } catch {
        // ignore if already applied
      }
    }
    schemaChecked = true;
  } catch (err) {
    console.error('registered-acs schema migration error:', err);
  }
}

// GET /api/registered-acs?userId=X
export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
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
    await ensureSchema();
    const body = await request.json();
    const {
      userId,
      location,
      brandModel,
      acType,
      horsepower,
      yearAcquired,
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

    // Notice: location is no longer strictly required
    if (!userId || !brandModel || !acType || !horsepower) {
      return NextResponse.json(
        { error: 'Please provide Brand/Model, AC Type, and Horsepower' },
        { status: 400 }
      );
    }

    // Ensure user exists in database to avoid foreign key errors on Vercel
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      try {
        await prisma.user.create({
          data: {
            id: userId,
            email: `customer-${userId.slice(-6)}@frosttech.local`,
            password: 'dummy-password-hash',
            firstName: 'Valued',
            lastName: 'Customer',
            role: 'CUSTOMER',
          },
        });
      } catch (uErr) {
        console.warn('Could not auto-create user for registered AC:', uErr);
      }
    }

    const ac = await prisma.registeredAC.create({
      data: {
        userId,
        location: location || null,
        brandModel,
        acType,
        horsepower,
        yearAcquired: yearAcquired ? String(yearAcquired) : null,
        paymentType: paymentType || 'Manual Add',
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        months: months ? parseInt(months, 10) : null,
        pricePerMonth: pricePerMonth ? parseFloat(pricePerMonth) : null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        fullAddress: fullAddress || null,
        purchasedFromStore: purchasedFromStore === true,
        isEnrolledMaintenance: isEnrolledMaintenance === true,
        enrolledAt: isEnrolledMaintenance === true ? new Date() : null,
      } as any,
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
    await ensureSchema();
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
    await ensureSchema();
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
