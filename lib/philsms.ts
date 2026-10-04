export async function sendPhilSMS(recipient: string, message: string) {
  const token = process.env.PHILSMS_API_TOKEN;
  const senderId = process.env.PHILSMS_SENDER_ID || 'PhilSMS';

  if (!token) {
    console.warn('PHILSMS_API_TOKEN is not set in environment variables. SMS not sent.');
    return { success: false, error: 'API token missing' };
  }

  // Ensure recipient is in standard format (e.g. starting with 63)
  // Strip non-numeric characters
  let cleanNumber = recipient.replace(/\D/g, '');
  if (cleanNumber.startsWith('09')) {
    cleanNumber = '63' + cleanNumber.substring(1);
  }

  try {
    const response = await fetch('https://dashboard.philsms.com/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        recipient: cleanNumber,
        sender_id: senderId,
        type: 'plain',
        message: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('PhilSMS Error:', data);
      return { success: false, error: data.message || 'Failed to send SMS' };
    }

    console.log('PhilSMS Success:', data);
    return { success: true, data };
  } catch (error) {
    console.error('PhilSMS Network Error:', error);
    return { success: false, error: 'Network error occurred while sending SMS' };
  }
}
