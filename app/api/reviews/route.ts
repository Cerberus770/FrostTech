import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reviews?productId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, userId, userName, rating, comment } = body;

    if (!productId || !userId || !userName || !rating || !comment) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        userName,
        rating: Number(rating),
        comment,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Review create error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
