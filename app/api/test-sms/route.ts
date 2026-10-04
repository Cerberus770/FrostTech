import { NextRequest, NextResponse } from 'next/server';
import { sendPhilSMS } from '@/lib/philsms';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ 
      error: "Please provide a phone number. Example: /api/test-sms?phone=09123456789" 
    }, { status: 400 });
  }

  try {
    const result = await sendPhilSMS(
      phone, 
      "Hello! This is a test message from FrostTech Cooling Solutions."
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Test SMS Error:", error);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
