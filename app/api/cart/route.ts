import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/cart?userId=X
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const items = await prisma.cartItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Cart fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

// POST /api/cart — Add or upsert item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, name, price, image, quantity } = body;

    if (!userId || !productId || !name || price == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: { quantity: { increment: quantity || 1 } },
      create: {
        userId,
        productId,
        name,
        price,
        image: image || '/placeholder.png',
        quantity: quantity || 1,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Cart add error:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

// PATCH /api/cart — Update quantity
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, quantity } = body;

    if (!id || quantity == null) {
      return NextResponse.json({ error: 'id and quantity are required' }, { status: 400 });
    }

    const item = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Cart update error:', error);
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
  }
}

// DELETE /api/cart?id=X or DELETE /api/cart?userId=X&clearAll=true
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const clearAll = searchParams.get('clearAll');

    if (clearAll === 'true' && userId) {
      await prisma.cartItem.deleteMany({ where: { userId } });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    await prisma.cartItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart delete error:', error);
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 });
  }
}
