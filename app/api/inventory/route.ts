import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/inventory
export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { sku: 'asc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

// POST /api/inventory - Add new item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publishToStorefront, condition, ...inventoryData } = body;
    const item = await prisma.inventoryItem.create({ data: inventoryData });
    
    if (publishToStorefront) {
      const conditionLabel = condition || 'Brand New';
      
      // Check if a product with the same model+brand already exists
      const existingProduct = await prisma.product.findFirst({
        where: {
          name: inventoryData.model,
          brand: inventoryData.brand,
        },
        include: { variants: true },
      });

      if (existingProduct) {
        // Add as a new condition variant to the existing product
        await prisma.productVariant.create({
          data: {
            productId: existingProduct.id,
            condition: conditionLabel,
            price: inventoryData.price,
            stock: inventoryData.stock || 0,
          }
        });

        // Update the product's display price to the lowest variant price
        const allVariants = [...existingProduct.variants, { price: inventoryData.price }];
        const lowestPrice = Math.min(...allVariants.map(v => v.price));
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: { price: lowestPrice },
        });
      } else {
        // Create new product with its first variant
        const badgeMap: Record<string, string> = {
          'Brand New': 'New',
          'Second Hand': 'Used',
          'On-Hand': 'On-Hand',
        };
        const newProduct = await prisma.product.create({
          data: {
            slug: inventoryData.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: inventoryData.model,
            brand: inventoryData.brand,
            category: inventoryData.category,
            price: inventoryData.price,
            image: inventoryData.image || 'https://via.placeholder.com/150',
            badge: badgeMap[conditionLabel] || 'New',
            specs: [],
          }
        });
        // Create the first variant
        await prisma.productVariant.create({
          data: {
            productId: newProduct.id,
            condition: conditionLabel,
            price: inventoryData.price,
            stock: inventoryData.stock || 0,
          }
        });
      }
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Inventory create error:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}

// PATCH /api/inventory - Update stock
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Inventory update error:', error);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}
