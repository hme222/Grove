// POST /api/waitlist { email } -> stores the address in Atlas (grove_db.waitlist).
// Needs MONGO_URL (and optionally DB_NAME) as Vercel environment variables.
const { MongoClient } = require('mongodb');

let client;
function getClient() {
  if (!client) client = new MongoClient(process.env.MONGO_URL, { maxPoolSize: 3 });
  return client;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  if (!process.env.MONGO_URL) return res.status(500).json({ error: 'not_configured' });
  try {
    const db = getClient().db(process.env.DB_NAME || 'grove_db');
    const waitlist = db.collection('waitlist');
    await waitlist.createIndex({ email: 1 }, { unique: true });
    // Joining twice is fine: keep the first signup date.
    await waitlist.updateOne(
      { email },
      { $setOnInsert: { email, joined_at: new Date(), source: 'landing' } },
      { upsert: true }
    );
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('waitlist error', e.message);
    return res.status(500).json({ error: 'save_failed' });
  }
};
