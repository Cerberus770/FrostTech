import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const requests = await (prisma as any).techRequest.findMany({
      include: {
        technician: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const formattedRequests = requests.map((req: any) => ({
      id: req.id,
      reqId: req.reqId,
      technicianName: `${req.technician.firstName} ${req.technician.lastName}`,
      itemNeeded: req.itemNeeded,
      quantity: req.quantity,
      reason: req.reason,
      status: req.status,
      createdAt: req.createdAt,
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error('Failed to fetch tech requests:', error);
    return NextResponse.json({ error: 'Failed to fetch tech requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newReq = await (prisma as any).techRequest.create({
      data: {
        reqId: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        technicianId: body.technicianId,
        itemNeeded: body.itemNeeded,
        quantity: body.quantity,
        reason: body.reason,
        status: 'Pending',
      }
    });
    return NextResponse.json(newReq, { status: 201 });
  } catch (error) {
    console.error('Failed to create tech request:', error);
    return NextResponse.json({ error: 'Failed to create tech request' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await (prisma as any).techRequest.update({
      where: { id: body.id },
      data: { status: body.status }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update tech request:', error);
    return NextResponse.json({ error: 'Failed to update tech request' }, { status: 500 });
  }
}
