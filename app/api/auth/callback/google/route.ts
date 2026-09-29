import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Direct Google OAuth2 - Step 2: Handle callback from Google
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error || !code) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`;

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
    }

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(new URL('/login?error=no_email', request.url));
    }

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          password: hashedPassword,
          firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || 'Google',
          lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || 'User',
          role: 'CUSTOMER',
        },
      });
    }

    // Set a temporary cookie with user data that the sync page will read
    const userData = JSON.stringify({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });

    const response = NextResponse.redirect(new URL('/auth/sync', request.url));
    response.cookies.set('google_auth_data', userData, {
      path: '/',
      maxAge: 60, // expires in 60 seconds — just enough time for sync page to read it
      httpOnly: false, // needs to be readable by client-side JS
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
  }
}
