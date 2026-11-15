import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './notify.js'

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this }
  }
}

const request = (overrides = {}) => ({
  method: 'POST',
  headers: { origin: 'https://saathicare-five.vercel.app', 'x-forwarded-for': '192.0.2.10' },
  body: { to: ['family@example.com'], subject: 'Reminder', text: 'Please check in.' },
  ...overrides
})

describe('notification API', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('MAIL_FROM', 'SaathiCare <care@example.com>')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'email_test_123' })
    }))
  })

  it('rejects methods other than POST', async () => {
    const res = response()
    await handler(request({ method: 'GET' }), res)
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toBe('POST')
  })

  it('rejects requests from unknown origins', async () => {
    const res = response()
    await handler(request({ headers: { origin: 'https://attacker.example', 'x-forwarded-for': '192.0.2.220' } }), res)
    expect(res.statusCode).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('validates recipient and message fields before calling the provider', async () => {
    const res = response()
    await handler(request({ body: { to: ['not-an-email'], subject: '', text: '' } }), res)
    expect(res.statusCode).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns a successful provider response without exposing the API key', async () => {
    const res = response()
    await handler(request(), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true, id: 'email_test_123' })
    expect(fetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-key' })
    }))
  })

  it('returns a configuration error when the API key is absent', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const res = response()
    await handler(request(), res)
    expect(res.statusCode).toBe(503)
    expect(fetch).not.toHaveBeenCalled()
  })
})
