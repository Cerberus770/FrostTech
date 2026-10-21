import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const migrationResults: string[] = [];
  try {
    // Self-healing database migration for cloud database (Neon)
    const migrations = [
      `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CLERK';`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "techRank" TEXT;`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" TEXT DEFAULT '[]';`,
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "downpaymentProof" TEXT;`,
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "hasDownpayment" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "notice3Days" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "notice3DaysAt" TIMESTAMP(3);`,
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "hp" TEXT;`,
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "itemType" TEXT;`,
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION;`,
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "assignedTech" TEXT;`,
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "scheduledDate" TEXT;`,
      `ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "assignedTech" TEXT;`,
      `ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "scheduledDate" TEXT;`,
      `ALTER TABLE "dispatch_items" ADD COLUMN IF NOT EXISTS "scheduledDate" TEXT;`,
      `ALTER TABLE "dispatch_items" ADD COLUMN IF NOT EXISTS "assignedTechName" TEXT;`,
      `ALTER TABLE "dispatch_items" ADD COLUMN IF NOT EXISTS "horsepower" TEXT;`,
      `ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "notice3Days" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "notice3DaysAt" TIMESTAMP(3);`,
      `CREATE TABLE IF NOT EXISTS "registered_acs" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "location" TEXT NOT NULL,
        "brandModel" TEXT NOT NULL,
        "acType" TEXT NOT NULL,
        "horsepower" TEXT NOT NULL,
        "paymentType" TEXT NOT NULL,
        "totalPrice" DOUBLE PRECISION,
        "months" INTEGER,
        "pricePerMonth" DOUBLE PRECISION,
        "lat" DOUBLE PRECISION,
        "lng" DOUBLE PRECISION,
        "fullAddress" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "installedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastServiceDate" TIMESTAMP(3),
        "nextServiceDue" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "tech_requests" (
        "id" TEXT PRIMARY KEY,
        "reqId" TEXT NOT NULL UNIQUE,
        "technicianId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "itemNeeded" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "reason" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "addresses" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "label" TEXT NOT NULL,
        "fullAddress" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "lat" DOUBLE PRECISION,
        "lng" DOUBLE PRECISION,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "cart_items" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "productId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "image" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "notice3Days" BOOLEAN NOT NULL DEFAULT false,
        "notice3DaysAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "cart_items_userId_productId_key" UNIQUE ("userId", "productId")
      );`,
      `CREATE TABLE IF NOT EXISTS "invoices" (
        "id" TEXT PRIMARY KEY,
        "invoiceNo" TEXT NOT NULL UNIQUE,
        "type" TEXT NOT NULL,
        "dispatchId" TEXT NOT NULL,
        "dispatchNo" TEXT NOT NULL,
        "customerName" TEXT NOT NULL,
        "serviceType" TEXT NOT NULL,
        "acUnit" TEXT NOT NULL,
        "location" TEXT NOT NULL,
        "technicianName" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Sent',
        "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "notes" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "_TechnicianDispatch" (
        "A" TEXT NOT NULL REFERENCES "dispatch_items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "B" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "_TechnicianDispatch_AB_unique" UNIQUE ("A", "B")
      );`,
      `CREATE INDEX IF NOT EXISTS "_TechnicianDispatch_B_index" ON "_TechnicianDispatch"("B");`
    ];

    for (const ddl of migrations) {
      try {
        await prisma.$executeRawUnsafe(ddl);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        migrationResults.push(msg);
      }
    }

    // Test database connection
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      userCount,
      migrationsRun: migrations.length,
      migrationErrors: migrationResults.length > 0 ? migrationResults : undefined,
      timestamp: new Date().toISOString(),
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: message,
      migrationErrors: migrationResults,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
        nodeEnv: process.env.NODE_ENV,
      },
    }, { status: 500 });
  }
}
