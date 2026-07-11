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
    const OTP_SECRET = process.env.ADMIN_OTP_SECRET;
    const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

    if (!OTP_SECRET || !SESSION_SECRET) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Admin login is not configured yet.' }) };
    }

    const { otp, challenge } = JSON.parse(event.body);
    if (!otp || !challenge) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code.' }) };
    }

    const decoded = Buffer.from(challenge, 'base64').toString('utf8');
    const [expiryStr, sig] = decoded.split(':');

    if (!expiryStr || !sig || Date.now() > Number(expiryStr)) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'That code expired. Request a new one.' }) };
    }

    const expectedSig = sign(otp + ':' + expiryStr, OTP_SECRET);
    if (expectedSig !== sig) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Incorrect code.' }) };
    }

    const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const sessionSig = sign(String(sessionExpiry), SESSION_SECRET);
    const session = Buffer.from(sessionExpiry + ':' + sessionSig).toString('base64');

    return { statusCode: 200, headers, body: JSON.stringify({ session }) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Something went wrong. Try again.' }) };
  }
};
