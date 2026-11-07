import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function ensureInventorySchema() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "inventory_items" (
        "id" TEXT PRIMARY KEY,
        "sku" TEXT NOT NULL UNIQUE,
        "brand" TEXT NOT NULL,
        "model" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "horsepower" TEXT,
        "description" TEXT,
        "stock" INTEGER NOT NULL DEFAULT 0,
        "price" DOUBLE PRECISION NOT NULL,
        "image" TEXT,
        "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "status" TEXT NOT NULL DEFAULT 'In Stock',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "horsepower" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "description" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'In Stock';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "image" TEXT;`);
  } catch (err) {
    console.error('ensureInventorySchema error:', err);
  }
}

// GET /api/inventory
export async function GET() {
  try {
    await ensureInventorySchema();
    let items = await prisma.inventoryItem.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Auto-seed inventory if database is empty (e.g. on cloud Neon PostgreSQL)
    if (items.length === 0) {
      const seedItems = [
        { sku: 'AC-CAR-01', brand: 'Carrier', model: 'Inverter', category: 'Split Type Inverter', horsepower: '1.0 HP', description: 'Carrier Inverter Split Type AC with R32 refrigerant.', stock: 10, price: 32000, status: 'In Stock', image: '/hero-bg.png', images: ['/hero-bg.png'] },
        { sku: 'AC-CHQ-01', brand: 'Chiq', model: 'Inverter', category: 'Split Type Inverter', horsepower: '1.0 HP', description: 'Chiq Inverter Split Type AC, energy saving.', stock: 8, price: 18500, status: 'In Stock', image: '/hero-bg.png', images: ['/hero-bg.png'] },
        { sku: 'AC-IFF-01', brand: 'iFFALCON', model: 'Inverter', category: 'Split Type Inverter', horsepower: '1.0 HP', description: 'iFFALCON Inverter Split Type AC with smart AI.', stock: 12, price: 19900, status: 'In Stock', image: '/hero-bg.png', images: ['/hero-bg.png'] },
        { sku: 'AC-MID-01', brand: 'Midea', model: 'Full DC Inverter', category: 'Split Type Inverter', horsepower: '1.5 HP', description: 'Midea Full DC Inverter with iECO mode.', stock: 15, price: 26500, status: 'In Stock', image: '/hero-bg.png', images: ['/hero-bg.png'] },
        { sku: 'AC-SAM-01', brand: 'Samsung', model: 'Inverter', category: 'Split Type Inverter', horsepower: '1.5 HP', description: 'Samsung Inverter Split Type AC, fast cooling.', stock: 6, price: 35000, status: 'In Stock', image: '/hero-bg.png', images: ['/hero-bg.png'] },
        { sku: 'AC-TCL-01', brand: 'TCL', model: 'Split type Inverter', category: 'Split Type Inverter', horsepower: '1.0 HP', description: 'TCL Split Type Inverter with TitanGold fins.', stock: 20, price: 16990, status: 'In Stock', image: '/hero-bg.png', images: ['/hero-bg.png'] },
        { sku: 'PRT-R32-10', brand: 'Generic', model: 'Refrigerant R-32 (10kg Cylinder)', category: 'Spare Parts', horsepower: null, description: '10kg R-32 Refrigerant Cylinder.', stock: 10, price: 4500, status: 'In Stock', image: '/hero-bg.png', images: ['/hero-bg.png'] },
        { sku: 'PRT-CAP-45', brand: 'Generic', model: 'Starting Capacitor 45uF 450V', category: 'Spare Parts', horsepower: null, description: 'Universal 45uF 450V starting capacitor.', stock: 35, price: 350, status: 'In Stock', image: '/hero-bg.png', images: ['/hero-bg.png'] },
        { sku: 'PRT-COP-14', brand: 'Generic', model: 'Copper Tube 1/4" x 1/2" (Roll)', category: 'Spare Parts', horsepower: null, description: 'High-grade copper tubing 1/4" x 1/2" roll.', stock: 5, price: 3200, status: 'In Stock', image: '/hero-bg.png', images: ['/hero-bg.png'] },
        { sku: 'PRT-MID-CMP', brand: 'Midea', model: 'Midea Compressor', category: 'Split Type Inverter', horsepower: '0.75 HP', description: 'Best Budget friendly AC compressor replacement.', stock: 10, price: 13000, status: 'In Stock', image: '/hero-bg.png', images: ['/hero-bg.png'] }
      ];

      for (const item of seedItems) {
        try {
          await prisma.inventoryItem.create({ data: item });
        } catch {}
      }

      items = await prisma.inventoryItem.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory', details: error?.message }, { status: 500 });
  }
}

// POST /api/inventory - Add new item (Unified AC & Spare Parts, Multi-Images, HP, Description, Auto-Storefront)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cleanSku = (body.sku || '').trim();

    if (!cleanSku) {
      return NextResponse.json({ error: 'SKU code is required.' }, { status: 400 });
    }

    // Check for duplicate SKU before inserting
    const existingSkuItem = await prisma.inventoryItem.findUnique({
      where: { sku: cleanSku },
    });
    if (existingSkuItem) {
      return NextResponse.json(
        { error: `The SKU code "${cleanSku}" is already used by "${existingSkuItem.brand} ${existingSkuItem.model}". Please provide a unique SKU code.` },
        { status: 409 }
      );
    }

    const images: string[] = Array.isArray(body.images) && body.images.length > 0
      ? body.images
      : body.image ? [body.image] : [];
    const mainImage = images[0] || body.image || 'https://via.placeholder.com/300';

    const inventoryData = {
      sku: cleanSku,
      brand: body.brand,
      model: body.model,
      category: body.category,
      horsepower: body.horsepower || null,
      description: body.description || null,
      stock: parseInt(body.stock, 10) || 0,
      price: parseFloat(body.price),
      image: mainImage,
      images: images,
      status: (parseInt(body.stock, 10) || 0) > 5 ? 'In Stock' : (parseInt(body.stock, 10) || 0) > 0 ? 'Low Stock' : 'Out of Stock',
    };

    const item = await prisma.inventoryItem.create({ data: inventoryData });

    // Automatic add to landing page / storefront as "Brand New"
    const conditionLabel = 'Brand New';
    const slug = (inventoryData.sku || inventoryData.model).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    const existingProduct = await prisma.product.findFirst({
      where: {
        name: inventoryData.model,
        brand: inventoryData.brand,
        category: inventoryData.category,
      },
      include: { variants: true },
    });

    if (existingProduct) {
      await prisma.productVariant.create({
        data: {
          productId: existingProduct.id,
          condition: conditionLabel,
          price: inventoryData.price,
          stock: inventoryData.stock,
        },
      });

      const allVariants = [...existingProduct.variants, { price: inventoryData.price }];
      const lowestPrice = Math.min(...allVariants.map((v) => v.price));
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          price: lowestPrice,
          image: mainImage || existingProduct.image,
          images: images.length > 0 ? images : existingProduct.images,
          horsepower: inventoryData.horsepower || existingProduct.horsepower,
          description: inventoryData.description || existingProduct.description,
          badge: 'Brand New',
        },
      });
    } else {
      const newProduct = await prisma.product.create({
        data: {
          slug,
          name: inventoryData.model,
          brand: inventoryData.brand,
          category: inventoryData.category,
          price: inventoryData.price,
          image: mainImage,
          images: images,
          horsepower: inventoryData.horsepower,
          description: inventoryData.description,
          badge: 'Brand New',
          specs: inventoryData.horsepower ? [inventoryData.horsepower, 'Brand New', inventoryData.category] : ['Brand New', inventoryData.category],
        },
      });

      await prisma.productVariant.create({
        data: {
          productId: newProduct.id,
          condition: conditionLabel,
          price: inventoryData.price,
          stock: inventoryData.stock,
        },
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Inventory create error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
      return NextResponse.json(
        { error: 'This SKU code is already taken by another inventory item. Please enter a unique SKU.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message || 'Failed to create inventory item' }, { status: 500 });
  }
}

// PATCH /api/inventory - Update stock or details
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    // If stock or price changed, sync with the corresponding product variant
    if (data.stock !== undefined || data.price !== undefined) {
      try {
        const prod = await prisma.product.findFirst({
          where: {
            brand: { equals: item.brand, mode: 'insensitive' },
            name: { contains: item.model, mode: 'insensitive' },
          },
          include: { variants: true },
        });

        if (prod && prod.variants && prod.variants.length > 0) {
          const brandNew = prod.variants.find((v) => v.condition === 'Brand New') || prod.variants[0];
          if (brandNew) {
            await prisma.productVariant.update({
              where: { id: brandNew.id },
              data: {
                ...(data.stock !== undefined ? { stock: parseInt(data.stock, 10) || 0 } : {}),
                ...(data.price !== undefined ? { price: parseFloat(data.price) || brandNew.price } : {}),
              },
            });
          }
        }
      } catch (syncErr) {
        console.error('Error syncing inventory stock to product variant:', syncErr);
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Inventory update error:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}

// DELETE /api/inventory?id=X
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory delete error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
