const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const rateLimit = new Map()
const WINDOW_MS = 60_000
const MAX_REQUESTS = 10

function allowedOrigin(origin) {
  if (!origin) return false
  const configured = process.env.APP_ORIGIN
  const allowed = new Set([
    'https://saathicare-five.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(configured ? [configured] : [])
  ])
  return allowed.has(origin)
}

function withinRateLimit(key, now = Date.now()) {
  const current = rateLimit.get(key)
  if (!current || now - current.startedAt >= WINDOW_MS) {
    rateLimit.set(key, { startedAt: now, count: 1 })
    return true
  }
  if (current.count >= MAX_REQUESTS) return false
  current.count += 1
  return true
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!allowedOrigin(req.headers?.origin)) {
    return res.status(403).json({ error: 'Origin not allowed' })
  }

  const forwardedFor = req.headers?.['x-forwarded-for']
  const clientIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : 'unknown'
  if (!withinRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many notification requests. Try again shortly.' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'Email service is not configured' })

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const recipients = Array.isArray(body.to)
    ? [...new Set(body.to.filter(value => typeof value === 'string').map(value => value.trim()).filter(value => emailPattern.test(value)))].slice(0, 5)
    : []
  const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 180) : ''
  const message = typeof body.text === 'string' ? body.text.trim().slice(0, 3000) : ''

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
