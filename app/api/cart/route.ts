import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPhilSMS } from '@/lib/philsms';

// Helper: Reduce stock from inventory when item added to cart
async function reduceStock(productId: string, name: string, qty: number) {
  try {
    const inv = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { id: productId },
          { sku: productId },
          { model: { equals: name, mode: 'insensitive' } },
        ],
      },
    });
    if (inv) {
      const newStock = Math.max(0, inv.stock - qty);
      await prisma.inventoryItem.update({
        where: { id: inv.id },
        data: {
          stock: newStock,
          status: newStock > 5 ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock',
        },
      });
    }

    const prod = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { name: { equals: name, mode: 'insensitive' } },
        ],
      },
      include: { variants: true },
    });
    if (prod && prod.variants.length > 0) {
      const variant = prod.variants[0];
      const newStock = Math.max(0, variant.stock - qty);
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { stock: newStock },
      });
    }
  } catch (e) {
    console.error('Failed to reduce stock on cart add:', e);
  }
}

// Helper: Restore stock to inventory when item removed or 3-day notice expired
async function restoreStock(productId: string, name: string, qty: number) {
  try {
    const inv = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { id: productId },
          { sku: productId },
          { model: { equals: name, mode: 'insensitive' } },
        ],
      },
    });
    if (inv) {
      const newStock = inv.stock + qty;
      await prisma.inventoryItem.update({
        where: { id: inv.id },
        data: {
          stock: newStock,
          status: newStock > 5 ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock',
        },
      });
    }

    const prod = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { name: { equals: name, mode: 'insensitive' } },
        ],
      },
      include: { variants: true },
    });
    if (prod && prod.variants.length > 0) {
      const variant = prod.variants[0];
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { stock: variant.stock + qty },
      });
    }
  } catch (e) {
    console.error('Failed to restore stock on cart remove:', e);
  }
}

// GET /api/cart?userId=X OR /api/cart?admin=true (or all items for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('admin') === 'true' || (!userId && searchParams.get('guest') !== 'true');

    // Check for expired items (notice3Days active > 3 days OR older than 5 days without purchase)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    try {
      const expiredItems: any[] = await prisma.$queryRawUnsafe(`
        SELECT id, "productId", name, quantity 
        FROM cart_items 
        WHERE ("notice3Days" = true AND "notice3DaysAt" <= $1)
           OR ("createdAt" <= $2)
      `, threeDaysAgo, fiveDaysAgo);

      if (Array.isArray(expiredItems)) {
        for (const exp of expiredItems) {
          await restoreStock(exp.productId, exp.name, exp.quantity);
          await prisma.$executeRawUnsafe(`DELETE FROM cart_items WHERE id = $1`, exp.id);
        }
      }
    } catch (e) {
      console.warn('Expired cart cleanup error:', e);
    }

    if (isAdmin) {
      try {
        const allItems: any[] = await prisma.$queryRawUnsafe(`
          SELECT c.*, u."firstName", u."lastName", u.email, u.phone 
          FROM cart_items c
          LEFT JOIN users u ON c."userId" = u.id
          ORDER BY c."createdAt" DESC
        `);

        const formatted = allItems.map(item => ({
          id: item.id,
          userId: item.userId,
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          notice3Days: !!item.notice3Days,
          notice3DaysAt: item.notice3DaysAt,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          user: item.firstName ? {
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            phone: item.phone
          } : null
        }));

        return NextResponse.json(formatted);
      } catch (adminErr) {
        console.warn('Admin raw cart query error, fallback to prisma:', adminErr);
        const fallback = await prisma.cartItem.findMany({
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(fallback);
      }
    }

    // Specific user items
    try {
      const userItems: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM cart_items 
        WHERE "userId" = $1 
        ORDER BY "createdAt" DESC
      `, userId);

      const formatted = userItems.map(item => ({
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        notice3Days: !!item.notice3Days,
        notice3DaysAt: item.notice3DaysAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      return NextResponse.json(formatted);
    } catch (userErr) {
      console.warn('User cart raw query error, fallback to prisma:', userErr);
      const fallback = await prisma.cartItem.findMany({
        where: { userId: userId || '' },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []);
      return NextResponse.json(fallback);
    }
  } catch (error) {
    console.error('Cart fetch error:', error);
    return NextResponse.json([]);
  }
}

// POST /api/cart — Add or upsert item and reduce inventory stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, name, price, image, quantity } = body;
    const addQty = quantity || 1;

    if (!productId || !name || price == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If no userId, return guest response
    if (!userId) {
      return NextResponse.json({
        id: 'guest-' + Date.now(),
        productId,
        name,
        price: Number(price),
        image: image || '/hero-bg.png',
        quantity: addQty,
        guest: true,
      }, { status: 201 });
    }

    // Check if user exists in DB to prevent foreign key violation
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
    } catch (dbErr) {
      console.warn('User lookup DB error (e.g. cloud DB offline):', dbErr);
    }

    let savedItem: any = null;

    if (user) {
      try {
        savedItem = await prisma.cartItem.upsert({
          where: { userId_productId: { userId, productId } },
          update: {
            quantity: { increment: addQty },
            updatedAt: new Date(),
          },
          create: {
            userId,
            productId,
            name,
            price: Number(price),
            image: image || '/hero-bg.png',
            quantity: addQty,
            createdAt: new Date(),
          },
        });
      } catch (upsertErr) {
        console.warn('Upsert fallback to raw SQL:', upsertErr);
        const cartId = 'cm' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        await prisma.$executeRawUnsafe(`
          INSERT INTO cart_items (id, "userId", "productId", name, price, image, quantity, "createdAt", "updatedAt", "notice3Days")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), false)
          ON CONFLICT ("userId", "productId")
          DO UPDATE SET quantity = cart_items.quantity + $7, "updatedAt" = NOW()
        `, cartId, userId, productId, name, Number(price), image || '/hero-bg.png', addQty).catch(() => {});

        savedItem = { id: cartId, userId, productId, name, price, image, quantity: addQty };
      }
    } else {
      // User doesn't exist in DB (e.g., guest session or local session on Vercel)
      savedItem = {
        id: 'c-' + Date.now(),
        userId,
        productId,
        name,
        price: Number(price),
        image: image || '/hero-bg.png',
        quantity: addQty,
      };
    }

    // Reduce stock from inventory stack
    await reduceStock(productId, name, addQty).catch(() => {});

    return NextResponse.json(savedItem, { status: 201 });
  } catch (error) {
    console.error('Cart add error (returning resilient cart item):', error);
    try {
      const body = await request.clone().json().catch(() => ({}));
      return NextResponse.json({
        id: 'cart-' + Date.now(),
        userId: body.userId,
        productId: body.productId,
        name: body.name,
        price: Number(body.price),
        image: body.image || '/hero-bg.png',
        quantity: body.quantity || 1,
      }, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
    }
  }
}

// PATCH /api/cart — Update quantity OR trigger 3-Day Notice OR Release to Stock
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, quantity, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    let currentItem: any = await prisma.cartItem.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, phone: true } } },
    });

    if (!currentItem) {
      const rawRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT c.*, u."firstName", u."lastName", u.phone 
        FROM cart_items c
        LEFT JOIN users u ON c."userId" = u.id
        WHERE c.id = $1
      `, id);
      if (rawRows && rawRows.length > 0) {
        currentItem = {
          ...rawRows[0],
          user: rawRows[0].firstName ? {
            firstName: rawRows[0].firstName,
            lastName: rawRows[0].lastName,
            phone: rawRows[0].phone
          } : null
        };
      }
    }

    if (!currentItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    // Action 1: Send 3-Day Notice
    if (action === 'send3DayNotice') {
      try {
        await prisma.$executeRawUnsafe(`
          UPDATE cart_items 
          SET "notice3Days" = true, "notice3DaysAt" = NOW() 
          WHERE id = $1
        `, id);
      } catch (err) {
        console.error('Failed to update notice3Days:', err);
      }

      // Send SMS notice to customer
      if (currentItem.user && currentItem.user.phone) {
        try {
          const msg = `Hi ${currentItem.user.firstName}! Your reserved aircon (${currentItem.name}) in your FrostTech cart has an active 3-Day Notice. Please proceed to checkout within 3 days, otherwise the unit will be released back to store stock. Thank you!`;
          await sendPhilSMS(currentItem.user.phone, msg);
        } catch (smsErr) {
          console.error('Cart notice SMS error:', smsErr);
        }
      }

      return NextResponse.json({ success: true, notice3Days: true, notice3DaysAt: new Date() });
    }

    // Action 2: Release back to inventory stock & remove from customer's cart
    if (action === 'releaseToStock') {
      await restoreStock(currentItem.productId, currentItem.name, currentItem.quantity);
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM cart_items WHERE id = $1`, id);
      } catch (delErr) {
        await prisma.cartItem.delete({ where: { id } }).catch(() => {});
      }

      if (currentItem.user && currentItem.user.phone) {
        try {
          const msg = `Hi ${currentItem.user.firstName}, your cart reservation for "${currentItem.name}" has expired and has been returned to store stock.`;
          await sendPhilSMS(currentItem.user.phone, msg);
        } catch (smsErr) {
          console.error('Cart release SMS error:', smsErr);
        }
      }

      return NextResponse.json({ success: true, released: true });
    }

    // Standard quantity update
    if (quantity != null) {
      const diff = quantity - currentItem.quantity;
      if (diff > 0) {
        await reduceStock(currentItem.productId, currentItem.name, diff);
      } else if (diff < 0) {
        await restoreStock(currentItem.productId, currentItem.name, Math.abs(diff));
      }

      try {
        const item = await prisma.cartItem.update({
          where: { id },
          data: { quantity },
        });
        return NextResponse.json(item);
      } catch {
        await prisma.$executeRawUnsafe(`UPDATE cart_items SET quantity = $1, "updatedAt" = NOW() WHERE id = $2`, quantity, id);
        return NextResponse.json({ id, quantity });
      }
    }

    return NextResponse.json({ error: 'No valid action provided' }, { status: 400 });
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
      const userItems = await prisma.cartItem.findMany({ where: { userId } });
      for (const item of userItems) {
        await restoreStock(item.productId, item.name, item.quantity);
      }
      await prisma.cartItem.deleteMany({ where: { userId } });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (item) {
      await restoreStock(item.productId, item.name, item.quantity);
      await prisma.cartItem.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart delete error:', error);
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 });
  }
}
