import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { products as fallbackProducts } from '@/lib/products';

async function ensureProductsSchema() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" TEXT PRIMARY KEY,
        "slug" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "brand" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "originalPrice" DOUBLE PRECISION,
        "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "sold" INTEGER NOT NULL DEFAULT 0,
        "image" TEXT NOT NULL,
        "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "horsepower" TEXT,
        "badge" TEXT,
        "specs" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "horsepower" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "badge" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "specs" TEXT[] DEFAULT ARRAY[]::TEXT[];`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" TEXT;`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "product_variants" (
        "id" TEXT PRIMARY KEY,
        "productId" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "condition" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "stock" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error('ensureProductsSchema error:', err);
  }
}

// GET /api/products - include variants
export async function GET() {
  try {
    await ensureProductsSchema();
    let prods = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { variants: true },
    });

    // Auto-seed storefront products if empty
    if (prods.length === 0) {
      for (const p of fallbackProducts) {
        try {
          const prodAny = p as any;
          await prisma.product.create({
            data: {
              slug: prodAny.slug || p.id,
              name: p.name,
              brand: p.brand,
              category: p.category,
              price: p.price,
              originalPrice: p.originalPrice ?? null,
              rating: p.rating,
              sold: p.sold,
              image: p.image,
              images: p.images || [p.image],
              horsepower: (p.specs || []).find((s: string) => s.includes('HP')) || null,
              badge: p.badge ?? null,
              specs: p.specs || [],
              description: p.description ?? null,
              variants: {
                create: [
                  { condition: 'Brand New', price: p.price, stock: 10 }
                ]
              }
            }
          });
        } catch {}
      }

      prods = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: { variants: true },
      });
    }

    // Self-healing: Ensure every product has variants and stock synced from inventory
    for (const p of prods) {
      if (!p.variants || p.variants.length === 0) {
        try {
          const invItem = await prisma.inventoryItem.findFirst({
            where: {
              brand: { equals: p.brand, mode: 'insensitive' },
              model: { contains: p.name, mode: 'insensitive' },
            },
          });
          const stock = invItem ? invItem.stock : 10;
          const newVariant = await prisma.productVariant.create({
            data: {
              productId: p.id,
              condition: 'Brand New',
              price: p.price,
              stock: stock,
            },
          });
          p.variants = [newVariant];
        } catch (e) {
          console.error(`Error backfilling variant for product ${p.id}:`, e);
        }
      }
    }

    return NextResponse.json(prods);
  } catch (error: any) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch products', details: error?.message }, { status: 500 });
  }
}

// PATCH /api/products - Update product (discount, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const product = await prisma.product.update({
      where: { id },
      data,
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
