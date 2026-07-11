const https = require('https');
const crypto = require('crypto');

function sign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function sessionValid(token, secret) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [expiryStr, sig] = decoded.split(':');
    if (!expiryStr || !sig) return false;
    if (Date.now() > Number(expiryStr)) return false;
    return sign(expiryStr, secret) === sig;
  } catch (e) {
    return false;
  }
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SESSION_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Leads storage is not configured yet.' }) };
    }

    const { session } = JSON.parse(event.body || '{}');
    if (!session || !sessionValid(session, SESSION_SECRET)) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not logged in.' }) };
    }

    const host = SUPABASE_URL.replace('https://', '').replace(/\/$/, '');

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: host,
        path: '/rest/v1/ft_leads?select=*&order=created_at.desc',
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.end();
    });

    const leads = JSON.parse(result.body);

    if (result.status < 200 || result.status >= 300) {
      // Supabase sent back an error, not data, surface exactly what it said instead of hiding it.
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Supabase error: ' + (leads.message || result.body) }) };
    }

    if (!Array.isArray(leads)) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Unexpected response from Supabase: ' + JSON.stringify(leads) }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ leads }) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not load leads. Try again.' }) };
  }
};
