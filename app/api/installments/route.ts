import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPhilSMS } from '@/lib/philsms';

let schemaChecked = false;

async function ensureInstallmentsSchema() {
  if (schemaChecked) return;
  try {
    // 1. Ensure CI_ACCEPTED enum value exists in PostgreSQL
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        ALTER TYPE "InstallmentStatus" ADD VALUE IF NOT EXISTS 'CI_ACCEPTED';
      EXCEPTION
        WHEN duplicate_object THEN null;
        WHEN others THEN null;
      END $$;
    `);
  } catch {
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "InstallmentStatus" ADD VALUE 'CI_ACCEPTED';`);
    } catch {}
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "location" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "assignedTech" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "scheduledDate" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "issue" TEXT DEFAULT '';`);
  } catch (err) {
    console.error('Installment schema migration error:', err);
  }
  schemaChecked = true;
}

// GET /api/installments
export async function GET(request: NextRequest) {
  try {
    await ensureInstallmentsSchema();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const installments = await prisma.installment.findMany({
      where: userId ? { userId } : {},
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(installments);
  } catch (error) {
    console.error('Installments fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch installments' }, { status: 500 });
  }
}

// POST /api/installments - Create new installment application
export async function POST(request: NextRequest) {
  try {
    await ensureInstallmentsSchema();
    const body = await request.json();
    const installment = await prisma.installment.create({ data: body });
    return NextResponse.json(installment, { status: 201 });
  } catch (error) {
    console.error('Installment create error:', error);
    return NextResponse.json({ error: 'Failed to create installment' }, { status: 500 });
  }
}

// PATCH /api/installments - Update status, CI details, or payment tracking
export async function PATCH(request: NextRequest) {
  try {
    await ensureInstallmentsSchema();
    const body = await request.json();
    const { id, customSms, customerPhone, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing installment ID' }, { status: 400 });
    }

    let installment: any;
    try {
      installment = await prisma.installment.update({
        where: { id },
        data,
      });
    } catch (updateErr: any) {
      console.warn('Standard prisma.installment.update failed, trying fallback by ID/appId:', updateErr?.message);
      try {
        if (data.status) {
          await prisma.$executeRawUnsafe(
            `UPDATE "installments" SET "status" = $1::"InstallmentStatus", "updatedAt" = NOW() WHERE "id" = $2 OR "appId" = $2`,
            data.status,
            id
          );
        }
        if (data.issue !== undefined) {
          await prisma.$executeRawUnsafe(
            `UPDATE "installments" SET "issue" = $1, "updatedAt" = NOW() WHERE "id" = $2 OR "appId" = $2`,
            data.issue,
            id
          );
        }
        if (data.assignedTech || data.scheduledDate) {
          await prisma.$executeRawUnsafe(
            `UPDATE "installments" SET "assignedTech" = COALESCE($1, "assignedTech"), "scheduledDate" = COALESCE($2, "scheduledDate"), "updatedAt" = NOW() WHERE "id" = $3 OR "appId" = $3`,
            data.assignedTech || null,
            data.scheduledDate || null,
            id
          );
        }
        installment = await prisma.installment.findFirst({
          where: { OR: [{ id }, { appId: id }] },
        });
      } catch (fallbackErr) {
        console.error('Fallback update also failed:', fallbackErr);
        throw updateErr;
      }
    }

    if (!installment) {
      return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
    }

    // Background SMS notification - do not await to avoid blocking response or timeouts
    (async () => {
      try {
        if (customSms && customerPhone) {
          await sendPhilSMS(customerPhone, customSms);
        } else if (
          data.status === 'CI_ACCEPTED' ||
          data.status === 'COMPLETED' ||
          data.status === 'REJECTED'
        ) {
          let targetPhone = customerPhone;
          let targetName = installment.name || 'Valued Customer';

          if (installment.userId && installment.userId !== 'guest') {
            try {
              const customer = await prisma.user.findUnique({
                where: { id: installment.userId },
                select: { phone: true, firstName: true },
              });
              if (customer?.phone) targetPhone = customer.phone;
              if (customer?.firstName) targetName = customer.firstName;
            } catch {}
          }

          if (targetPhone) {
            let msg = '';
            if (data.status === 'CI_ACCEPTED') {
              msg = `Hi ${targetName}! Your FrostTech installment application (${installment.appId}) for "${installment.item}" has been accepted for Credit Investigation (CI). Our verification team will contact you shortly.`;
            } else if (data.status === 'COMPLETED') {
              const schedInfo = data.scheduledDate
                ? ` Installation is scheduled for ${data.scheduledDate}.`
                : '';
              msg = `Congratulations ${targetName}! Your FrostTech installment application (${installment.appId}) for "${installment.item}" has been APPROVED.${schedInfo} Thank you for choosing FrostTech!`;
            } else if (data.status === 'REJECTED') {
              msg = `Hi ${targetName}, we regret to inform you that your FrostTech installment application (${installment.appId}) was not approved at this time. ${installment.issue ? 'Reason: ' + installment.issue : 'Please contact us for more details.'}`;
            }
            if (msg) {
              await sendPhilSMS(targetPhone, msg);
            }
          }
        }
      } catch (smsError) {
        console.error('Failed to send installment status SMS:', smsError);
      }
    })();

    return NextResponse.json(installment);
  } catch (error: any) {
    console.error('Installment update error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update installment' }, { status: 500 });
  }
}
