import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, subject, message } = body;

    if (!type || !to || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a production environment, you would integrate with an email provider like SendGrid, Resend, or AWS SES here.
    // For now, we simulate the successful delivery of the notification.

    console.log('\n=========================================');
    console.log(`[NOTIFICATION API] Sending Notification...`);
    console.log(`Type: ${type}`);
    console.log(`To: ${to}`);
    if (subject) console.log(`Subject: ${subject}`);
    console.log(`Message: \n${message}`);
    
    // Simulate setting up a future email reminder
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
