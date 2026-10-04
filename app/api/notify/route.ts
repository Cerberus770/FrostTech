import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, subject, message } = body;

    if (!type || !to || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'SMS_CUSTOMER') {
      const apiKey = process.env.SEMAPHORE_API_KEY;
      if (!apiKey) {
         console.warn('SEMAPHORE_API_KEY is not set in .env. SMS was not actually sent.');
         return NextResponse.json({ success: true, message: 'SMS simulated (Missing API Key)' }, { status: 200 });
      }

      // Format the phone number (Semaphore prefers standard PH format 09XXXXXXXXX)
      let cleanNumber = to.replace(/[^0-9+]/g, '');
      if (cleanNumber.startsWith('+63')) {
        cleanNumber = '0' + cleanNumber.substring(3);
      } else if (cleanNumber.startsWith('63')) {
        cleanNumber = '0' + cleanNumber.substring(2);
      }

      // Validate - must be 11 digits starting with 09
      if (!cleanNumber.match(/^09\d{9}$/)) {
        return NextResponse.json({ error: `Invalid phone number: "${to}". Please use a valid PH mobile number (e.g. 09171234567).` }, { status: 400 });
      }

      console.log(`[SEMAPHORE] Sending SMS to ${cleanNumber}...`);
      
      const response = await fetch('https://api.semaphore.co/api/v4/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          apikey: apiKey,
          number: cleanNumber,
          message: message,
          // sendername: 'FROSTTECH' // Uncomment if you have an approved sender name in Semaphore
        })
      });

      const responseText = await response.text();
      console.log('[SEMAPHORE] Raw Response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        // Semaphore returned plain text instead of JSON
        if (!response.ok) {
          console.error('Semaphore API Error (text):', responseText);
          return NextResponse.json({ error: `Semaphore error: ${responseText}` }, { status: 400 });
        }
        // If response is OK but not JSON, treat as success
        data = { message: responseText };
      }
      
      if (!response.ok) {
         console.error('Semaphore API Error:', data);
         return NextResponse.json({ error: `Semaphore error: ${JSON.stringify(data)}` }, { status: 400 });
      }

      console.log('[SEMAPHORE] SMS Sent Successfully!', data);
      return NextResponse.json({ success: true, message: 'SMS sent via Semaphore successfully', data }, { status: 200 });
    }

    // Original simulated email handling for EMAIL_CUSTOMER
    console.log('\n=========================================');
    console.log(`[NOTIFICATION API] Sending Notification...`);
    console.log(`Type: ${type}`);
    console.log(`To: ${to}`);
    if (subject) console.log(`Subject: ${subject}`);
    console.log(`Message: \n${message}`);
    
    if (type === 'EMAIL_CUSTOMER') {
      const user = await prisma.user.findUnique({ where: { email: to } });
      if (user) {
        console.log(`\n[EMAIL REMINDER API] Scheduling Follow-up Email...`);
        console.log(`To Email: ${user.email}`);
        console.log(`Reminder Subject: Reminder: ${subject}`);
        console.log(`Reminder Message: Hi ${user.firstName}, this is a quick reminder regarding your upcoming FrostTech service.`);
      }
    }
    
    console.log('=========================================\n');

    return NextResponse.json({ success: true, message: 'Notification sent successfully' }, { status: 200 });

  } catch (error) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
