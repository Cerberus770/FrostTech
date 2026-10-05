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

  // A minimal, valid mock PDF (blank page) encoded in base64
  const mockPdfBase64 = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLU31jBQU0hQcgz1C1TUMDPTdE0OC1EMUDA0sDI0MFBSCOYDA0EjBQMEwlh1IB4YFqXhXFwKxGJoA9eMNCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKNjEKZW5kb2JqCgo1IDAgb2JqCjw8L0xlbmd0aCA2IDAgUi9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoMSAxODQ+PgpzdHJlYW0KeJxzTTE0MFbIz0vNK0m1yk0tSdUryc/PzNErSU0uyEkt00tJTc7PzQOqKigpLE0Fylfkl2Rm5qUWG+sZGhgbmRkqJCjkJyqUKBRnFOcnK+hH5+cl5qUWFyTm6RUllmTmpQKNg2oB0qC2QvSABaL/hI0F2t7U1DSEAAXl6yEKZW5kc3RyZWFtCmVuZG9iagoKNiAwIG9iagoxMzAKZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvRm9udERlc2NyaXB0b3IvRm9udE5hbWUvQkFBQUFBK0FyaWFsLUJvbGRJdGFsaWNNVC9Gb250QkJveFswIDAgMCAwXS9GbGFncyA0L0FzY2VudCAwL0NhcEhlaWdodCAwL0Rlc2NlbnQgMC9JdGFsaWNBbmdsZSAwL1N0ZW1WIDAvTWF4V2lkdGggMC9YTWhpbiAwL0ZvbnRGaWxlMiA1IDAgUj4+CmVuZG9iagoKNyAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UcnVlVHlwZS9CYXNlRm9udC9CQUFBQUErQXJpYWwtQm9sZEl0YWxpY01UL0ZpcnN0Q2hhciAwL0xhc3RDaGFyIDAvV2lkdGhzWzAgXS9Gb250RGVzY3JpcHRvciA0IDAgUj4+CmVuZG9iagoKOCAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMC9CYXNlRm9udC9CQUFBQUErQXJpYWwtQm9sZEl0YWxpY01UL0VuY29kaW5nL0lkZW50aXR5LUgvRGVzY2VuZGFudEZvbnRzWzcgMCBSXT4+CmVuZG9iagoKMSAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDkgMCBSL1Jlc291cmNlczw8L0ZvbnQ8PC9GMCA4IDAgUj4+Pj4vTWVkaWFCb3hbMCAwIDU5NS4yOCA4NDEuODldL0Fubm90c1tdL0NvbnRlbnRzIDIgMCBSPj4KZW5kb2JqCgo5IDAgb2JqCjw8L1R5cGUvUGFnZXMvS2lkc1sxIDAgUl0vQ291bnQgMT4+CmVuZG9iagoKMTAgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDkgMCBSPj4KZW5kb2JqCgp4cmVmCjAgMTEKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwNjMyIDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDEwNSAwMDAwMCBuIAowMDAwMDAwMjk2IDAwMDAwIG4gCjAwMDAwMDAxMjQgMDAwMDAgbiAKMDAwMDAwMDI3NiAwMDAwMCBuIAowMDAwMDAwNDczIDAwMDAwIG4gCjAwMDAwMDA1ODcgMDAwMDAgbiAKMDAwMDAwMDc0NSAwMDAwMCBuIAowMDAwMDAwODAwIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSAxMS9Sb290IDEwIDAgUj4+CnN0YXJ0eHJlZgo4NTAKJSVFT0YK";

  const mailOptions = {
    from: `"FrostTech Cooling Solutions" <${gmailUser}>`,
    to: data.to,
    subject: `FrostTech Invoice ${data.invoiceNo} — ${data.serviceType}`,
    html: htmlContent,
    attachments: [
      {
        filename: `FrostTech_Invoice_${data.invoiceNo}.pdf`,
        content: Buffer.from(mockPdfBase64, 'base64'),
        contentType: 'application/pdf'
      }
    ]
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
