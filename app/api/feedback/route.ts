import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function ensureFeedbackSchema() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "customer_feedbacks" (
        "id" TEXT PRIMARY KEY,
        "customerName" TEXT NOT NULL,
        "customerLocation" TEXT,
        "customerAvatar" TEXT,
        "unitModel" TEXT NOT NULL,
        "serviceType" TEXT DEFAULT 'Installment AC Purchase',
        "rating" INTEGER NOT NULL DEFAULT 5,
        "review" TEXT NOT NULL,
        "verified" BOOLEAN DEFAULT true,
        "date" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error('ensureFeedbackSchema error:', err);
  }
}

// GET /api/feedback - Retrieve customer feedback reviews
export async function GET() {
  try {
    await ensureFeedbackSchema();

    let feedbacks: any[] = await prisma.$queryRawUnsafe(`
      SELECT * FROM "customer_feedbacks" ORDER BY "createdAt" DESC;
    `);

    // Auto-seed initial reviews if empty
    if (feedbacks.length === 0) {
      const seedReviews = [
        {
          id: 'fb-1',
          customerName: 'Engr. Roberto Martinez',
          customerLocation: 'Quezon City, Metro Manila',
          customerAvatar: 'RM',
          unitModel: 'Carrier Aura Inverter 1.5 HP Split Type',
          serviceType: 'Installment AC Purchase',
          rating: 5,
          review: 'The installment application process was very straightforward and Credit Investigation (CI) was verified promptly. Clear monthly amortization schedule and polite customer assistance!',
          verified: true,
          date: 'November 4, 2026',
        },
        {
          id: 'fb-2',
          customerName: 'Dr. Maria Carmela Santos',
          customerLocation: 'BGC, Taguig City',
          customerAvatar: 'MS',
          unitModel: 'Daikin D-Smart King Inverter 2.0 HP',
          serviceType: 'Cash on Arrival Delivery',
          rating: 5,
          review: 'High quality cooling solutions and very professional delivery team. The technicians followed condominium safety rules diligently. Air conditioner runs whisper quiet.',
          verified: true,
          date: 'November 1, 2026',
        },
        {
          id: 'fb-3',
          customerName: 'Joshua Rioja',
          customerLocation: 'Jasaan, Misamis Oriental',
          customerAvatar: 'JR',
          unitModel: 'TCL Split type Inverter (1.0 HP)',
          serviceType: 'Installment AC Purchase',
          rating: 5,
          review: 'Very convenient installment option for families. Low initial deposit and technician came on the scheduled date for clean back-to-back installation.',
          verified: true,
          date: 'October 28, 2026',
        },
        {
          id: 'fb-4',
          customerName: 'Michelle Dizon',
          customerLocation: 'Cagayan de Oro City',
          customerAvatar: 'MD',
          unitModel: 'Midea Full DC Inverter 1.5 HP',
          serviceType: 'Installment AC Purchase',
          rating: 5,
          review: 'Super cooling performance with low electricity power draw! The 6-month installment plan made budgeting so easy for our master bedroom.',
          verified: true,
          date: 'October 20, 2026',
        },
      ];

      for (const r of seedReviews) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "customer_feedbacks" ("id", "customerName", "customerLocation", "customerAvatar", "unitModel", "serviceType", "rating", "review", "verified", "date")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT ("id") DO NOTHING;`,
          r.id,
          r.customerName,
          r.customerLocation,
          r.customerAvatar,
          r.unitModel,
          r.serviceType,
          r.rating,
          r.review,
          r.verified,
          r.date
        );
      }

      feedbacks = await prisma.$queryRawUnsafe(`
        SELECT * FROM "customer_feedbacks" ORDER BY "createdAt" DESC;
      `);
    }

    return NextResponse.json(feedbacks);
  } catch (error: any) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer feedback', details: error?.message }, { status: 500 });
  }
}

// POST /api/feedback - Customer submits a review
export async function POST(request: NextRequest) {
  try {
    await ensureFeedbackSchema();
    const body = await request.json();

    const customerName = (body.customerName || 'Anonymous Customer').trim();
    const customerLocation = (body.customerLocation || 'Philippines').trim();
    const unitModel = (body.unitModel || 'FrostTech Air Conditioner').trim();
    const serviceType = body.serviceType || 'AC Purchase / Installment';
    const rating = Math.min(5, Math.max(1, parseInt(body.rating, 10) || 5));
    const review = (body.review || '').trim();

    if (!review) {
      return NextResponse.json({ error: 'Review text cannot be empty.' }, { status: 400 });
    }

    const id = 'fb-' + Date.now();
    const initials = customerName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join('') || 'FC';

    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    await prisma.$executeRawUnsafe(
      `INSERT INTO "customer_feedbacks" ("id", "customerName", "customerLocation", "customerAvatar", "unitModel", "serviceType", "rating", "review", "verified", "date")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      id,
      customerName,
      customerLocation,
      initials,
      unitModel,
      serviceType,
      rating,
      review,
      true,
      dateStr
    );

    const created = {
      id,
      customerName,
      customerLocation,
      customerAvatar: initials,
      unitModel,
      serviceType,
      rating,
      review,
      verified: true,
      date: dateStr,
      createdAt: new Date(),
    };

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Feedback submit error:', error);
    return NextResponse.json({ error: 'Failed to submit review', details: error?.message }, { status: 500 });
  }
}

