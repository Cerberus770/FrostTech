import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all invoices
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST a new invoice
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Generate invoice number
    const count = await prisma.invoice.count();
    const invoiceNo = `INV-${String(count + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        type: body.type, // "ADMIN" or "CUSTOMER"
        dispatchId: body.dispatchId,
        dispatchNo: body.dispatchNo || '',
        customerName: body.customerName,
        serviceType: body.serviceType,
        acUnit: body.acUnit,
        location: body.location || '',
        technicianName: body.technicianName,
        status: 'Sent',
        amount: body.amount || 0,
        notes: body.notes || ''
      }
    });

    // If it's a customer invoice, send via Gmail and PhilSMS
    if (body.type === 'CUSTOMER') {
      try {
        // Look up the customer's email and phone from the dispatch record
        let customerEmail = '';
        let customerPhone = '';
        const dispatchRecord = await prisma.dispatchItem.findUnique({
          where: { id: body.dispatchId }
        });
        
        if (dispatchRecord?.customerId) {
          const customer = await prisma.user.findUnique({
            where: { id: dispatchRecord.customerId }
          });
          if (customer?.email) customerEmail = customer.email;
          if (customer?.phone) customerPhone = customer.phone;
        }

        if (customerEmail) {
          try {
            const { sendInvoiceEmail } = await import('@/lib/gmail');
            await sendInvoiceEmail({
              to: customerEmail,
              invoiceNo,
              customerName: body.customerName,
              serviceType: body.serviceType,
              acUnit: body.acUnit,
              location: body.location || '',
              technicianName: body.technicianName,
              amount: body.amount || 0,
              notes: body.notes || '',
              date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            });
            console.log(`[INVOICE] Email sent to ${customerEmail} for ${invoiceNo}`);
          } catch (emailErr) {
            console.warn(`[INVOICE] Email to ${customerEmail} failed, but continuing to SMS. Error:`, emailErr);
          }
        } else {
          console.warn(`[INVOICE] No customer email found for dispatch ${body.dispatchId}. Email not sent.`);
        }

        if (customerPhone && customerPhone !== 'N/A') {
          const { sendPhilSMS } = await import('@/lib/philsms');
          const amountStr = body.amount ? ` Total: P${body.amount.toLocaleString()}.` : '';
          const message = `FrostTech: Your service invoice ${invoiceNo} for ${body.serviceType} is ready.${amountStr} Thank you for choosing FrostTech!`;
          await sendPhilSMS(customerPhone, message);
          console.log(`[INVOICE] SMS sent to ${customerPhone} for ${invoiceNo}`);
        } else {
          console.warn(`[INVOICE] No valid customer phone found for dispatch ${body.dispatchId}. SMS not sent.`);
        }

      } catch (notifyError) {
        console.error('[INVOICE] Failed to send email/SMS, but invoice was saved:', notifyError);
        // Don't fail the request - the invoice is still saved
      }
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

// PATCH - update invoice status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const invoice = await prisma.invoice.update({
      where: { id: body.id },
      data: { status: body.status }
    });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Failed to update invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
