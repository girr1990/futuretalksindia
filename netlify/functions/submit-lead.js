const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL; // e.g. https://xxxx.supabase.co
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      // Don't fail the visitor's WhatsApp handoff just because storage isn't wired up yet.
      return { statusCode: 200, headers, body: JSON.stringify({ stored: false, note: 'Storage not configured yet.' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const record = {
      name: (body.name || '').slice(0, 200),
      contact: (body.contact || '').slice(0, 200),
      interest: (body.interest || '').slice(0, 200),
      message: (body.message || '').slice(0, 2000),
      source: (body.source || 'website_widget').slice(0, 100)
    };

    const host = SUPABASE_URL.replace('https://', '').replace(/\/$/, '');
    const payload = JSON.stringify(record);

    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: host,
        path: '/rest/v1/leads',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    return { statusCode: 200, headers, body: JSON.stringify({ stored: true }) };

  } catch (error) {
    // Storage failing should never block the visitor, WhatsApp handoff still works independently.
    return { statusCode: 200, headers, body: JSON.stringify({ stored: false, error: 'Could not save, but your WhatsApp message still went through.' }) };
  }
};
