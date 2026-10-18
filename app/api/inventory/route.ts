import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/inventory
export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

// POST /api/inventory - Add new item (Unified AC & Spare Parts, Multi-Images, HP, Description, Auto-Storefront)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const images: string[] = Array.isArray(body.images) && body.images.length > 0
      ? body.images
      : body.image ? [body.image] : [];
    const mainImage = images[0] || body.image || 'https://via.placeholder.com/300';

    const inventoryData = {
      sku: body.sku,
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
          images: images.length > 0 ? images : existingProduct.images,
          horsepower: inventoryData.horsepower || existingProduct.horsepower,
          description: inventoryData.description || existingProduct.description,
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
