const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'Email service is not configured' })

  const body = req.body || {}
  const recipients = Array.isArray(body.to) ? [...new Set(body.to.filter(value => typeof value === 'string').map(value => value.trim()).filter(value => emailPattern.test(value)))].slice(0, 10) : []
  const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 180) : ''
  const message = typeof body.text === 'string' ? body.text.trim().slice(0, 5000) : ''

  if (!recipients.length || !subject || !message) {
    return res.status(400).json({ error: 'Valid recipients, subject and message are required' })
  }

  const from = process.env.MAIL_FROM || 'SaathiCare <onboarding@resend.dev>'
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: recipients, subject, text: message })
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) return res.status(response.status >= 500 ? 502 : response.status).json({ error: 'Email provider rejected the request' })
    return res.status(200).json({ ok: true, id: result.id })
  } catch {
    return res.status(502).json({ error: 'Unable to reach the email provider' })
  }
}
