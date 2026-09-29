import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const technicians = await prisma.user.findMany({
      where: { role: Role.TECHNICIAN },
      select: { id: true, firstName: true, lastName: true, techRank: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(technicians);
  } catch (error) {
    console.error('Technicians fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch technicians' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { techRank } = await request.json();

    if (!id || !techRank) {
      return NextResponse.json({ error: 'ID and techRank are required' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { techRank },
      select: { id: true, firstName: true, lastName: true, techRank: true },
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update techRank:', error);
    return NextResponse.json({ error: 'Failed to update technician rank' }, { status: 500 });
  }
}
