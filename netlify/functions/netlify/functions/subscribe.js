// netlify/functions/subscribe.js
// Newsletter / subscribe capture for every subscribe box across futuretalksindia.com.
// Writes to the REAL table (ft_leads) and reports failure honestly — a visitor is never
// told "You're in" unless a row actually landed.
//
// Env vars required (set in Netlify → Site configuration → Environment variables):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (falls back to SUPABASE_SERVICE_KEY if that's what's set)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Misconfiguration is a real failure — say so instead of pretending it worked.
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('subscribe: SUPABASE_URL or service key env var is not set');
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Subscription is temporarily unavailable.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Please enter a valid email address.' }),
    };
  }

  const record = {
    email,
    name: String(body.name || '').trim().slice(0, 200) || null,
    phone: String(body.phone || '').trim().slice(0, 40) || null,
    source: String(body.source || 'newsletter').trim().slice(0, 100),
    interest: String(body.interest || '').trim().slice(0, 200) || null,
  };

  try {
    const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/ft_leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(record),
    });

    // The bug in the old function: it never looked at the status code.
    if (!res.ok) {
      const detail = await res.text();
      console.error('subscribe: Supabase rejected insert', res.status, detail);
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: 'Could not save your subscription. Please try again.' }),
      };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('subscribe: network error', err.message);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: 'Could not reach the server. Please try again.' }),
    };
  }
};
