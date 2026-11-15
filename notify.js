export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { to, subject, text } = req.body || {};
  if (!process.env.RESEND_API_KEY || !Array.isArray(to) || !to.length)
    return res.status(503).json({ error: 'Email not configured' });
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'SaathiCare <onboarding@resend.dev>',
      to: to.slice(0, 5),
      subject: '[SaathiCare] ' + String(subject || '').slice(0, 120),
      text: String(text || '').slice(0, 1500),
    }),
  });
  return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
}
