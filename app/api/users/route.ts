import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/users - List users with optional role filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role');

    const users = await prisma.user.findMany({
      where: roleParam ? { role: roleParam as any } : {},
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        techRank: true,
        permissions: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            registeredACs: true,
            maintenanceJobs: true,
            assignedJobs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create new user (Technician, Customer, Admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, role, techRank, permissions } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: role as any,
        techRank: role === 'TECHNICIAN' ? (techRank || 'Senior Tech') : null,
        permissions: permissions ? JSON.stringify(permissions) : '[]',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        techRank: true,
        permissions: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PATCH /api/users - Update user role, techRank, and/or permissions
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, role, techRank, permissions } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (role !== undefined) {
      updateData.role = role;
      if (role !== 'TECHNICIAN') {
        updateData.techRank = null;
      }
    }
    if (techRank !== undefined) {
      if (role === 'TECHNICIAN' || updateData.role === 'TECHNICIAN') {
        updateData.techRank = techRank;
      } else if (role !== undefined && role !== 'TECHNICIAN') {
        updateData.techRank = null;
      } else {
        updateData.techRank = techRank;
      }
    }
    if (permissions !== undefined) updateData.permissions = JSON.stringify(permissions);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        techRank: true,
        permissions: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users?id=...
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
