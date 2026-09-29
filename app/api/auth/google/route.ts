import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Mock a google user
    const email = 'google@frosttech.com';
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('google123', 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: 'Google',
          lastName: 'User',
          role: 'CUSTOMER'
        }
      });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });

  } catch (error) {
    console.error('Mock Google auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
