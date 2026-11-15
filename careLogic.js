const pad = value => String(value).padStart(2, '0')

export function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function timeToMinutes(time) {
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function validateMedicationTimes(times) {
  return Array.isArray(times) && times.length > 0 &&
    times.every(time => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim()))
}

export function buildDoseSchedule(careCircle, date) {
  if (!careCircle || !Array.isArray(careCircle.meds)) return []
  const logs = new Map((careCircle.log || []).map(entry => [entry.key, entry]))
  return careCircle.meds
    .filter(medicine => !medicine.since || medicine.since <= date)
    .flatMap(medicine => (medicine.times || []).map(time => {
      const key = `${medicine.id}|${date}|${time}`
      return { m: medicine, t: time, key, e: logs.get(key) }
    }))
    .sort((a, b) => a.t.localeCompare(b.t))
}

export function getDoseStatus(dose, date, now = new Date()) {
  if (dose?.e?.status === 'taken') return 'taken'
  if (dose?.e?.status === 'missed') return 'missed'
  const today = dateKey(now)
  if (date < today) return 'missed'
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  if (dose?.e?.status === 'snoozed' && currentMinutes < dose.e.until) return 'snoozed'
  return currentMinutes >= timeToMinutes(dose.t) ? 'due' : 'upcoming'
}

function shiftDate(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function calculateAdherence(careCircle, now = new Date(), days = 7) {
  let total = 0
  let taken = 0
  const results = []
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = dateKey(shiftDate(now, -offset))
    let dayTaken = 0
    let dayTotal = 0
    buildDoseSchedule(careCircle, date).forEach(dose => {
      if (offset === 0 && timeToMinutes(dose.t) > now.getHours() * 60 + now.getMinutes()) return
      dayTotal += 1
      if (getDoseStatus(dose, date, now) === 'taken') dayTaken += 1
    })
    total += dayTotal
    taken += dayTaken
    results.push({
      dt: date,
      a: dayTaken,
      b: dayTotal,
      l: shiftDate(now, -offset).toLocaleDateString([], { weekday: 'short' })
    })
  }
  return { pct: total ? Math.round(taken / total * 100) : 100, days: results }
}

export function getDaysLeft(medicine) {
  if (medicine?.stock == null) return null
  const frequency = Array.isArray(medicine.times) ? medicine.times.length : 0
  return Math.floor(medicine.stock / (frequency || 1))
}

export function getVitalFlag(kind, first, second) {
  if (kind === 'bp') return first >= 140 || second >= 90 ? 'High' : first < 90 ? 'Low' : ''
  if (kind === 'sugar') return first > 180 ? 'High' : first < 70 ? 'Low' : ''
  if (kind === 'pulse') return first > 110 ? 'High' : first < 50 ? 'Low' : ''
  return ''
}
