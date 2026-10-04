import nodemailer from 'nodemailer';

// Gmail SMTP transporter using App Password
// To set this up:
// 1. Enable 2-Step Verification on your Google Account
// 2. Go to https://myaccount.google.com/apppasswords
// 3. Generate an App Password for "Mail"
// 4. Add GMAIL_USER and GMAIL_APP_PASSWORD to your .env.local
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface InvoiceEmailData {
  to: string;
  invoiceNo: string;
  customerName: string;
  serviceType: string;
  acUnit: string;
  location: string;
  technicianName: string;
  amount: number;
  notes: string;
  date: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailData) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn('[GMAIL] GMAIL_USER or GMAIL_APP_PASSWORD not set. Email simulated.');
    console.log(`[GMAIL SIMULATED] Would send invoice ${data.invoiceNo} to ${data.to}`);
    return { simulated: true, message: 'Email simulated (Gmail credentials not configured)' };
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0a3d62 0%, #1a6bb5 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">FrostTech Cooling Solutions</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Service Invoice</p>
      </div>
      
      <!-- Invoice Number Banner -->
      <div style="background: #f0f7ff; padding: 16px 30px; border-bottom: 1px solid #e0e8f0;">
        <table width="100%"><tr>
          <td><strong style="color: #0a3d62; font-size: 16px;">${data.invoiceNo}</strong></td>
          <td style="text-align: right; color: #666; font-size: 14px;">${data.date}</td>
        </tr></table>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px;">
        <p style="color: #333; font-size: 16px; margin: 0 0 20px;">Hello <strong>${data.customerName}</strong>,</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Thank you for choosing FrostTech! Below are the details of your completed service.
        </p>
        
        <!-- Invoice Details Table -->
        <table width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
          <tr style="background: #f8fafc;">
            <td style="padding: 12px 16px; border: 1px solid #e2e8f0; font-weight: 600; color: #0a3d62; width: 40%;">Service Type</td>
            <td style="padding: 12px 16px; border: 1px solid #e2e8f0; color: #333;">${data.serviceType}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #e2e8f0; font-weight: 600; color: #0a3d62;">AC Unit</td>
            <td style="padding: 12px 16px; border: 1px solid #e2e8f0; color: #333;">${data.acUnit}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 12px 16px; border: 1px solid #e2e8f0; font-weight: 600; color: #0a3d62;">Location</td>
            <td style="padding: 12px 16px; border: 1px solid #e2e8f0; color: #333;">${data.location}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #e2e8f0; font-weight: 600; color: #0a3d62;">Technician</td>
            <td style="padding: 12px 16px; border: 1px solid #e2e8f0; color: #333;">${data.technicianName}</td>
          </tr>
          ${data.notes ? `
          <tr style="background: #f8fafc;">
            <td style="padding: 12px 16px; border: 1px solid #e2e8f0; font-weight: 600; color: #0a3d62;">Notes</td>
            <td style="padding: 12px 16px; border: 1px solid #e2e8f0; color: #333;">${data.notes}</td>
          </tr>` : ''}
        </table>
        
        <!-- Amount -->
        ${data.amount > 0 ? `
        <div style="background: linear-gradient(135deg, #0a3d62 0%, #1a6bb5 100%); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="color: rgba(255,255,255,0.8); margin: 0 0 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Total Amount</p>
          <p style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">₱${data.amount.toLocaleString()}</p>
        </div>` : ''}
        
        <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0;">
          If you have any questions about this invoice, please contact us at 
          <a href="mailto:${gmailUser}" style="color: #1a6bb5;">${gmailUser}</a> or call us directly.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #999; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} FrostTech Cooling Solutions Co. All rights reserved.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"FrostTech Cooling Solutions" <${gmailUser}>`,
    to: data.to,
    subject: `FrostTech Invoice ${data.invoiceNo} — ${data.serviceType}`,
    html: htmlContent,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`[GMAIL] Invoice ${data.invoiceNo} sent to ${data.to}. MessageId: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error(`[GMAIL] Failed to send email to ${data.to}. Error:`, error.message);
    if (error.message.includes('Invalid login') || error.message.includes('Application-specific password required')) {
      console.error('\n🔴 CRITICAL GMAIL ERROR 🔴\nYour Gmail credentials in .env.local are invalid. Google now requires an "App Password", not your normal password.\nGo to https://myaccount.google.com/apppasswords to generate one.\n');
    }
    throw error;
  }
}
