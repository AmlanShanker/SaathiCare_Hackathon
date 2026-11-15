import { describe, expect, it } from 'vitest'
import {
  buildDoseSchedule,
  calculateAdherence,
  getDaysLeft,
  getDoseStatus,
  getVitalFlag,
  timeToMinutes,
  validateMedicationTimes
} from './careLogic.js'

const fixedNow = () => new Date(2026, 10, 15, 21, 0, 0)
const circle = (overrides = {}) => ({
  meds: [{ id: 'm1', name: 'Medicine', times: ['08:00', '20:00'], since: '2026-11-01' }],
  log: [],
  ...overrides
})

describe('medication schedule', () => {
  it('builds chronologically ordered dose instances and attaches their log entries', () => {
    const care = circle({ log: [{ key: 'm1|2026-11-15|08:00', status: 'taken' }] })
    const schedule = buildDoseSchedule(care, '2026-11-15')
    expect(schedule.map(item => item.t)).toEqual(['08:00', '20:00'])
    expect(schedule[0].e.status).toBe('taken')
  })

  it('does not schedule a medicine before its start date', () => {
    expect(buildDoseSchedule(circle(), '2026-10-31')).toHaveLength(0)
  })

  it('returns an empty schedule for malformed care-circle input', () => {
    expect(buildDoseSchedule(null, '2026-11-15')).toEqual([])
  })
})

describe('dose status', () => {
  it('honours an explicitly recorded taken dose', () => {
    expect(getDoseStatus({ t: '08:00', e: { status: 'taken' } }, '2026-11-15', fixedNow())).toBe('taken')
  })

  it('marks an unrecorded past dose as missed', () => {
    expect(getDoseStatus({ t: '08:00' }, '2026-11-14', fixedNow())).toBe('missed')
  })

  it('distinguishes upcoming, due and snoozed doses', () => {
    expect(getDoseStatus({ t: '22:00' }, '2026-11-15', fixedNow())).toBe('upcoming')
    expect(getDoseStatus({ t: '08:00' }, '2026-11-15', fixedNow())).toBe('due')
    expect(getDoseStatus({ t: '08:00', e: { status: 'snoozed', until: 22 * 60 } }, '2026-11-15', fixedNow())).toBe('snoozed')
  })
})

describe('adherence and medication utilities', () => {
  it('calculates a seven-day adherence percentage from recorded doses', () => {
    const care = circle({ meds: [{ id: 'm1', times: ['08:00'], since: '2026-11-01' }] })
    care.log = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(2026, 10, 15 - index)
      const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
      return { key: `m1|${date}|08:00`, status: index === 3 ? 'missed' : 'taken' }
    })
    expect(calculateAdherence(care, fixedNow()).pct).toBe(86)
  })

  it('returns 100 percent when there are no scheduled doses', () => {
    expect(calculateAdherence(circle({ meds: [] }), fixedNow()).pct).toBe(100)
  })

  it('validates 24-hour medication times and rejects malformed values', () => {
    expect(validateMedicationTimes(['08:00', '20:15'])).toBe(true)
    expect(validateMedicationTimes(['8:00'])).toBe(false)
    expect(validateMedicationTimes([])).toBe(false)
    expect(timeToMinutes('20:30')).toBe(1230)
    expect(Number.isNaN(timeToMinutes('25:00'))).toBe(true)
  })

  it('estimates days of stock based on daily scheduled frequency', () => {
    expect(getDaysLeft({ stock: 14, times: ['08:00', '20:00'] })).toBe(7)
    expect(getDaysLeft({ stock: null, times: ['08:00'] })).toBe(null)
  })

  it('flags out-of-range readings without classifying ordinary values', () => {
    expect(getVitalFlag('bp', 150, 92)).toBe('High')
    expect(getVitalFlag('sugar', 60)).toBe('Low')
    expect(getVitalFlag('pulse', 75)).toBe('')
  })
})
