import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return NextResponse.json({ error: 'No Google credential provided' }, { status: 400 });
    }

    // Decode the Google JWT token (ID token)
    // Google ID tokens are JWTs — we decode the payload (middle part)
    const parts = credential.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    // Decode base64url payload
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    );

    const { email, given_name, family_name, sub: googleId, picture } = payload;

    if (!email) {
      return NextResponse.json({ error: 'No email found in Google token' }, { status: 400 });
    }

    // Verify the token's audience matches our client ID
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (payload.aud !== clientId) {
      return NextResponse.json({ error: 'Token audience mismatch' }, { status: 401 });
    }

    // Check if token is expired
    if (payload.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user from Google data
      const hashedPassword = await bcrypt.hash(`google_${googleId}_${Date.now()}`, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: given_name || 'Google',
          lastName: family_name || 'User',
          role: 'CUSTOMER',
        },
      });
    }

    // Check if technician is pending approval
    if (user.role === 'TECHNICIAN' && user.techRank === 'Pending') {
      return NextResponse.json({ error: 'Your technician account is pending admin approval.' }, { status: 403 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });

  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Google authentication failed' }, { status: 500 });
  }
}
