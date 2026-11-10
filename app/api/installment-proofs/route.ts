import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function ensureInstallmentProofsSchema() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "installment_proofs" (
        "id" TEXT PRIMARY KEY,
        "customerName" TEXT NOT NULL,
        "customerLocation" TEXT NOT NULL,
        "customerAvatar" TEXT,
        "unitModel" TEXT NOT NULL,
        "unitType" TEXT NOT NULL DEFAULT 'Split',
        "horsepower" TEXT,
        "technicianName" TEXT NOT NULL,
        "technicianRole" TEXT,
        "jobOrderNo" TEXT NOT NULL,
        "installDate" TEXT NOT NULL,
        "installType" TEXT NOT NULL,
        "rating" INTEGER NOT NULL DEFAULT 5,
        "review" TEXT,
        "photoUrl" TEXT NOT NULL,
        "checklist" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error('ensureInstallmentProofsSchema error:', err);
  }
}

// GET /api/installment-proofs - Retrieve verified installation proofs
export async function GET() {
  try {
    await ensureInstallmentProofsSchema();

    let proofs: any[] = await prisma.$queryRawUnsafe(`
      SELECT * FROM "installment_proofs" ORDER BY "createdAt" DESC;
    `);

    // Auto-seed initial official proofs if empty
    if (proofs.length === 0) {
      const seedProofs = [
        {
          id: 'proof-1',
          customerName: 'Engr. Roberto Martinez',
          customerLocation: 'Quezon City, Metro Manila',
          customerAvatar: 'RM',
          unitModel: 'Midea Full DC Inverter 1.5 HP Split Type',
          unitType: 'Split',
          horsepower: '1.5 HP',
          technicianName: 'Carlos Rivera',
          technicianRole: 'Senior HVAC Field Specialist',
          jobOrderNo: 'JO-2026-4891',
          installDate: 'November 2, 2026',
          installType: 'Standard Back-to-Back Installation',
          rating: 5,
          review: 'Outstanding installment delivery! Technician Carlos arrived right on schedule with complete PPE and calibrated vacuum pump. Piping was cleanly wrapped with UV insulation tape and sealed.',
          photoUrl: '/installed-ac/midea1.jpg',
          checklist: [
            'Vacuum Pressure Tested (-30 inHg / 500 microns)',
            'Flare Nuts Torqued to Carrier Specs',
            'Condensate Gravity Drain Flow Verified',
            'Dedicated 20A Circuit Breaker Installed',
            'Refrigerant Operating Pressure Normal',
            'Customer Remote Operation Demo Given',
          ],
        },
        {
          id: 'proof-2',
          customerName: 'Dr. Maria Carmela Santos',
          customerLocation: 'BGC, Taguig City',
          customerAvatar: 'MS',
          unitModel: 'Midea Inverter 1.0 HP Split Type (Installed)',
          unitType: 'Split',
          horsepower: '1.0 HP',
          technicianName: 'Mark Anthony Bautista',
          technicianRole: 'Certified AC Technician #884',
          jobOrderNo: 'JO-2026-4762',
          installDate: 'October 29, 2026',
          installType: 'High-Rise Condominium Balcony Mounting',
          rating: 5,
          review: 'Very neat and polite technician! Our condo admin has strict permits and vibration guidelines. The FrostTech team followed all safety rules and used heavy-duty anti-vibration rubber pads.',
          photoUrl: '/installed-ac/midea2.jpg',
          checklist: [
            'Condo Admin Safety & Permit Compliant',
            'Heavy-Duty Vibration Dampener Pads',
            'R32 Refrigerant Operating Pressure Normal',
            'Condensate Leak & P-Trap Tested',
            'Wall Sealant & Weatherproofing Applied',
            'Electrical Load Balance Verified',
          ],
        },
        {
          id: 'proof-3',
          customerName: 'Arch. Kenneth Ramos',
          customerLocation: 'Ortigas, Pasig City',
          customerAvatar: 'KR',
          unitModel: 'Matrix Inverter 1.5 HP Split Type',
          unitType: 'Split',
          horsepower: '1.5 HP',
          technicianName: 'Carlos Rivera',
          technicianRole: 'Senior HVAC Field Specialist',
          jobOrderNo: 'JO-2026-4630',
          installDate: 'October 25, 2026',
          installType: 'Living Room Concealed Trunking Setup',
          rating: 5,
          review: 'The FrostTech technicians routed the copper tubings and drainage seamlessly along the molding with clean white trunking. Unit looks sleek and operates whisper quiet!',
          photoUrl: '/installed-ac/Matrix1.jpg',
          checklist: [
            'Precision Tube Bending Without Kinks',
            'Aesthetic Wall Trunking Installed',
            'Electrical Grounding & Amperage Normal',
            'Full Remote Handover & Function Briefing',
            'Pre-commissioning Leak Bubble Check OK',
            'Drainage Tested with 2 Liters Water',
          ],
        },
        {
          id: 'proof-4',
          customerName: 'Atty. Victor Consunji',
          customerLocation: 'New Manila, Quezon City',
          customerAvatar: 'VC',
          unitModel: 'Matrix Heavy-Duty Inverter 2.0 HP Split Type',
          unitType: 'Split',
          horsepower: '2.0 HP',
          technicianName: 'Ronald Maclang',
          technicianRole: 'Master HVAC Technician',
          jobOrderNo: 'JO-2026-4512',
          installDate: 'October 19, 2026',
          installType: 'Heavy-Duty Bracket Exterior Wall Mount',
          rating: 5,
          review: 'Top-tier service! The outdoor condenser was securely mounted on heavy-gauge stainless steel L-brackets with rubber isolators. Very quiet even at full turbo load.',
          photoUrl: '/installed-ac/matrix2.jpg',
          checklist: [
            'Heavy Gauge Stainless 304 L-Brackets',
            'Anti-Vibration Rubber Isolators Fitted',
            'Nitrogen Purge During Brazing Done',
            'Weatherproof Polyurethane Sealant Applied',
            'Thermal Imaging Pipe Insulation Check OK',
            'Digital Voltage & Current Logged Normal',
          ],
        },
        {
          id: 'proof-5',
          customerName: 'Mrs. Bernadette Lim',
          customerLocation: 'Binondo, Manila',
          customerAvatar: 'BL',
          unitModel: 'Carrier Inverter Split Type (Brand New)',
          unitType: 'Split',
          horsepower: '1.0 HP',
          technicianName: 'Mark Anthony Bautista',
          technicianRole: 'Certified AC Technician #884',
          jobOrderNo: 'JO-2026-4389',
          installDate: 'October 12, 2026',
          installType: 'Reinforced Window Opening Installation',
          rating: 5,
          review: 'Replacing our old loud window AC with this modern Carrier Inverter was a breeze. The technicians fitted the sleeve tightly, added acoustic sealing tape, and clean exterior bracket.',
          photoUrl: '/products/carrier.jpg',
          checklist: [
            'Structural Window Frame Leveled with 1/4" Slope',
            'High-Density Acoustic Foam Weatherstrip',
            'Exterior Bottom Support Angle Bracket',
            'Condensate Gravity Drainage Drainpipe Fitted',
            'Dedicated 15A Convenience Outlet Checked',
            'Energy Meter Wattage Verification Passed',
          ],
        },
        {
          id: 'proof-6',
          customerName: 'Capt. Antonio De Leon',
          customerLocation: 'Alabang, Muntinlupa City',
          customerAvatar: 'AD',
          unitModel: 'TCL Split type Inverter 1.0 HP (Installed)',
          unitType: 'Split',
          horsepower: '1.0 HP',
          technicianName: 'Ronald Maclang',
          technicianRole: 'Master HVAC Technician',
          jobOrderNo: 'JO-2026-4277',
          installDate: 'October 5, 2026',
          installType: 'Master Bedroom Custom Louver Fitment',
          rating: 5,
          review: 'Solid workmanship! Cleanly caulked silicone around the perimeter so no rain or insects can enter. Smart WiFi connects easily and cools our 22sqm room in minutes.',
          photoUrl: '/products/TCL1.webp',
          checklist: [
            'All-Weather Neutral Silicone Perimeter Seal',
            'Custom Aluminum Finishing Trim Installed',
            'Circuit Ground Fault (GFCI) Verified',
            'WiFi App Remote Pairing & Demo Given',
            'Decibel Sound Level Meter Check (< 42dB)',
            'Full 1-Year Workmanship Warranty Signed',
          ],
        },
      ];

      for (const p of seedProofs) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "installment_proofs" ("id", "customerName", "customerLocation", "customerAvatar", "unitModel", "unitType", "horsepower", "technicianName", "technicianRole", "jobOrderNo", "installDate", "installType", "rating", "review", "photoUrl", "checklist")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           ON CONFLICT ("id") DO NOTHING;`,
          p.id,
          p.customerName,
          p.customerLocation,
          p.customerAvatar,
          p.unitModel,
          p.unitType,
          p.horsepower,
          p.technicianName,
          p.technicianRole,
          p.jobOrderNo,
          p.installDate,
          p.installType,
          p.rating,
          p.review,
          p.photoUrl,
          p.checklist
        );
      }

      proofs = await prisma.$queryRawUnsafe(`
        SELECT * FROM "installment_proofs" ORDER BY "createdAt" DESC;
      `);
    }

    return NextResponse.json(proofs);
  } catch (error: any) {
    console.error('Installment proofs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch installment proofs', details: error?.message }, { status: 500 });
  }
}

// POST /api/installment-proofs - Admin posts a new installment/installation proof
export async function POST(request: NextRequest) {
  try {
    await ensureInstallmentProofsSchema();
    const body = await request.json();

    const customerName = (body.customerName || 'Valued Customer').trim();
    const customerLocation = (body.customerLocation || 'Philippines').trim();
    const unitModel = (body.unitModel || 'FrostTech Air Conditioner').trim();
    const unitType = body.unitType === 'Window' ? 'Window' : 'Split';
    const horsepower = body.horsepower || '1.5 HP';
    const technicianName = (body.technicianName || 'Certified Technician').trim();
    const technicianRole = body.technicianRole || 'Certified AC Specialist';
    const jobOrderNo = body.jobOrderNo || `INST-${Math.floor(1000 + Math.random() * 9000)}`;
    const installDate = body.installDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const installType = body.installType || 'Standard Back-to-Back Installation';
    const rating = Math.min(5, Math.max(1, parseInt(body.rating, 10) || 5));
    const review = body.review || 'Completed and verified AC installment by FrostTech technicians. Cooling and electrical parameters tested normal.';
    const photoUrl = body.photoUrl || '/hero-bg.png';
    const checklist = Array.isArray(body.checklist) && body.checklist.length > 0
      ? body.checklist
      : [
          'Vacuum Pressure Tested (-30 inHg / 500 microns)',
          'Condensate Gravity Drain Flow Verified',
          'Dedicated Circuit Breaker & Grounding Verified',
          'Refrigerant Operating Pressure Normal',
          'Customer Operation Briefing & Handover Completed',
        ];

    const id = 'proof-' + Date.now();
    const initials = customerName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join('') || 'FT';

    await prisma.$executeRawUnsafe(
      `INSERT INTO "installment_proofs" ("id", "customerName", "customerLocation", "customerAvatar", "unitModel", "unitType", "horsepower", "technicianName", "technicianRole", "jobOrderNo", "installDate", "installType", "rating", "review", "photoUrl", "checklist")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);`,
      id,
      customerName,
      customerLocation,
      initials,
      unitModel,
      unitType,
      horsepower,
      technicianName,
      technicianRole,
      jobOrderNo,
      installDate,
      installType,
      rating,
      review,
      photoUrl,
      checklist
    );

    const created = {
      id,
      customerName,
      customerLocation,
      customerAvatar: initials,
      unitModel,
      unitType,
      horsepower,
      technicianName,
      technicianRole,
      jobOrderNo,
      installDate,
      installType,
      rating,
      review,
      photoUrl,
      checklist,
      createdAt: new Date(),
    };

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Installment proof create error:', error);
    return NextResponse.json({ error: 'Failed to create installment proof', details: error?.message }, { status: 500 });
  }
}

// DELETE /api/installment-proofs?id=X - Admin deletes a proof
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.$executeRawUnsafe(`DELETE FROM "installment_proofs" WHERE "id" = $1;`, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Installment proof delete error:', error);
    return NextResponse.json({ error: 'Failed to delete installment proof', details: error?.message }, { status: 500 });
  }
}

