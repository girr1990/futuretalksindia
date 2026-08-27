const nodemailer = require('nodemailer');
const crypto = require('crypto');

function sign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
    const OTP_SECRET = process.env.ADMIN_OTP_SECRET;

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !OTP_SECRET) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Admin login is not configured yet. Missing environment variables.' }) };
    }

    // The OTP always goes to the fixed admin inbox, never to an address the caller supplies.
    const ADMIN_EMAIL = GMAIL_USER;

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    const sig = sign(otp + ':' + expiry, OTP_SECRET);
    const challenge = Buffer.from(expiry + ':' + sig).toString('base64');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
    });

    await transporter.sendMail({
      from: `FutureTalksIndia Admin <${GMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `Your FTI admin login code: ${otp}`,
      text: `Your login code is ${otp}. It expires in 10 minutes. If you didn't request this, ignore this email.`
    });

    return { statusCode: 200, headers, body: JSON.stringify({ challenge }) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not send the code. Try again.' }) };
  }
};
