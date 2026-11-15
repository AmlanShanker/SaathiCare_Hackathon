import { useState, useEffect, useRef } from 'react'

/* ---------- helpers ---------- */
const pad = n => String(n).padStart(2, '0')
const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const nowM = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() }
const tm = t => { const [h, m] = t.split(':'); return +h * 60 + +m }
const t12 = t => { const [h, m] = t.split(':'); return `${(+h) % 12 || 12}:${m} ${+h < 12 ? 'AM' : 'PM'}` }
const ago = n => dstr(new Date(Date.now() - n * 864e5))
const stamp = () => new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
const byWhen = (a, b) => (a.date + a.time).localeCompare(b.date + b.time)
const careTo = c => [c.emails.family, c.emails.caretaker].filter(Boolean)
const RN = { elder: 'Elder', family: 'Family', caretaker: 'Caretaker' }
const PILL = { white: '#E9EDF2', pink: '#F28DA6', yellow: '#F5C84C', blue: '#5B9BE8', green: '#58B77C', orange: '#F08A3C' }
const VK = { bp: { n: 'Blood pressure', u: 'mmHg' }, sugar: { n: 'Blood sugar', u: 'mg/dL' }, pulse: { n: 'Pulse', u: 'bpm' }, weight: { n: 'Weight', u: 'kg' } }
const fmtV = v => v.kind === 'bp' ? `${v.a}/${v.b}` : v.a
const flag = (k, a, b) => k === 'bp' ? (a >= 140 || b >= 90 ? 'High' : a < 90 ? 'Low' : '') : k === 'sugar' ? (a > 180 ? 'High' : a < 70 ? 'Low' : '') : k === 'pulse' ? (a > 110 ? 'High' : a < 50 ? 'Low' : '') : ''
const T = {
  en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', took: 'I took it', snooze: 'Remind me in 15 min', aloud: 'Read aloud', sos: 'SOS: I need help', today: 'Today', meds: 'Medicines', health: 'Health', visits: 'Visits', ask: 'Ask', overview: 'Overview', circle: 'Circle', feel: 'How are you feeling today?', good: 'Good', okay: 'Okay', bad: 'Not well', next: 'Next dose', done: 'All doses done for today', taken: 'doses taken today', gotit: 'Got it' },
  hi: { morning: 'सुप्रभात', afternoon: 'नमस्कार', evening: 'शुभ संध्या', took: 'मैंने दवा ले ली', snooze: '15 मिनट बाद याद दिलाएँ', aloud: 'पढ़कर सुनाएँ', sos: 'एसओएस: मदद चाहिए', today: 'आज', meds: 'दवाइयाँ', health: 'सेहत', visits: 'डॉक्टर', ask: 'पूछें', overview: 'सारांश', circle: 'परिवार', feel: 'आज आप कैसा महसूस कर रहे हैं?', good: 'अच्छा', okay: 'ठीक', bad: 'तबियत ठीक नहीं', next: 'अगली दवा', done: 'आज की सभी दवाइयाँ हो गईं', taken: 'दवाइयाँ ली गईं', gotit: 'समझ गया' },
}
const speak = (t, lang) => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'; speechSynthesis.speak(u) } catch { /* unsupported */ } }

/* ---------- care circle model ---------- */
function seed() {
  const c = {
    id: 'demo', elder: 'Kamala Devi', emails: { elder: '', family: '', caretaker: '' },
    codes: { elder: '1111', family: '2222', caretaker: '3333' },
    profile: { blood: 'B+', allergies: 'Penicillin', conditions: 'Type 2 diabetes, high blood pressure', doctor: 'Dr. Rao (Cardiologist)', doctorPhone: '+91 98765 43210' },
    contacts: [{ id: 'k1', name: 'Priya (daughter)', phone: '+91 98765 00001' }, { id: 'k2', name: 'Neighbour Meera', phone: '+91 98765 00002' }],
    meds: [
      { id: 'm1', name: 'Metformin', dose: '500 mg', food: 'After food', color: 'white', stock: 14, times: ['08:00', '20:00'], notes: 'For sugar control.', since: ago(8) },
      { id: 'm2', name: 'Amlodipine', dose: '5 mg', food: 'Any time', color: 'pink', stock: 9, times: ['09:00'], notes: 'For blood pressure.', since: ago(8) },
      { id: 'm3', name: 'Vitamin D3', dose: '1 capsule', food: 'With food', color: 'yellow', stock: 30, times: ['13:00'], notes: 'As advised by the doctor.', since: ago(8) },
    ],
    appts: [{ id: 'a1', doctor: 'Dr. Rao (Cardiologist)', date: ago(-3), time: '11:30', place: 'Manipal Hospital, Bengaluru', notes: 'Carry the BP diary' }],
    vitals: [], checkins: [], msgs: [], log: [], outbox: [], activity: [], sent: [],
  }
  const r = (a, b) => a + Math.round(Math.random() * (b - a))
  for (let i = 6; i >= 0; i--) {
    c.meds.forEach(m => m.times.forEach(t => { if (i > 0 && Math.random() > 0.2) c.log.push({ key: `${m.id}|${ago(i)}|${t}`, status: 'taken', by: 'elder' }) }))
    c.vitals.push({ id: 'vb' + i, date: ago(i), kind: 'bp', a: r(126, 148), b: r(78, 92) }, { id: 'vs' + i, date: ago(i), kind: 'sugar', a: r(105, 170) }, { id: 'vp' + i, date: ago(i), kind: 'pulse', a: r(68, 82) })
  }
  const d = dstr(new Date())
  c.meds.forEach(m => m.times.forEach(t => { if (tm(t) + 30 < nowM()) c.log.push({ key: `${m.id}|${d}|${t}`, status: 'taken', by: 'elder' }) }))
  return c
}
const doses = (c, date) => c.meds.filter(m => !m.since || m.since <= date).flatMap(m => m.times.map(t => {
  const key = `${m.id}|${date}|${t}`
  return { m, t, key, e: c.log.find(l => l.key === key) }
})).sort((a, b) => a.t.localeCompare(b.t))
function status(d, date) {
  if (d.e?.status === 'taken') return 'taken'
  if (d.e?.status === 'missed') return 'missed'
  if (date < dstr(new Date())) return 'missed'
  const n = nowM()
  if (d.e?.status === 'snoozed' && n < d.e.until) return 'snoozed'
  return n >= tm(d.t) ? 'due' : 'upcoming'
}
function dayStats(c, i) {
  const dt = ago(i); let a = 0, b = 0
  doses(c, dt).forEach(d => { if (i === 0 && tm(d.t) > nowM()) return; b++; if (status(d, dt) === 'taken') a++ })
  return { dt, a, b }
}
function adherence(c) {
  let tt = 0, tk = 0; const days = []
  for (let i = 6; i >= 0; i--) { const s = dayStats(c, i); tt += s.b; tk += s.a; days.push({ ...s, l: new Date(s.dt + 'T00:00').toLocaleDateString([], { weekday: 'short' }) }) }
  return { pct: tt ? Math.round(tk / tt * 100) : 100, days }
}
function streak(c) {
  let n = 0
  for (let i = 0; i < 60; i++) { const s = dayStats(c, i); if (!s.b) { if (i === 0) continue; break } if (s.a === s.b) n++; else if (i === 0) continue; else break }
  return n
}
function insight(c) {
  const B = { Morning: [0, 0], Afternoon: [0, 0], Evening: [0, 0] }
  for (let i = 0; i < 7; i++) doses(c, ago(i)).forEach(d => { if (i === 0 && tm(d.t) > nowM()) return; const h = tm(d.t) / 60, k = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'; B[k][1]++; if (status(d, ago(i)) !== 'taken') B[k][0]++ })
  const w = Object.entries(B).filter(e => e[1][1]).sort((a, b) => b[1][0] / b[1][1] - a[1][0] / a[1][1])[0]
  return w && w[1][0] ? `${w[0]} doses are missed most often (${w[1][0]} of ${w[1][1]} this week). A phone alarm or a family call at that time may help.` : 'No pattern of missed doses this week. Keep it up!'
}
const latest = (c, k) => c.vitals.filter(v => v.kind === k).sort((a, b) => a.date.localeCompare(b.date))
const daysLeft = m => m.stock == null ? null : Math.floor(m.stock / (m.times.length || 1))
function answer(c, q) {
  const date = dstr(new Date()), ds = doses(c, date)
  if (/(should|can i|change|stop|skip|increase|reduce|double)/.test(q) && /(dose|dosage|tablet|pill|medicine|more|less|double|stop|skip)/.test(q))
    return 'I cannot change or advise on doses. Please ask your doctor or pharmacist. I can only share what your care circle has recorded.'
  if (/(pressure|sugar|pulse|weight|vital)/.test(q)) {
    const k = /pressure/.test(q) ? 'bp' : /sugar/.test(q) ? 'sugar' : /pulse/.test(q) ? 'pulse' : /weight/.test(q) ? 'weight' : 'bp', l = latest(c, k).pop()
    return l ? `Your latest ${VK[k].n.toLowerCase()} is ${fmtV(l)} ${VK[k].u} on ${l.date}. Please share readings with your doctor.` : `No ${VK[k].n.toLowerCase()} readings yet. Add one in the Health tab.`
  }
  if (/(refill|stock|left|running)/.test(q)) { const lo = c.meds.filter(m => m.stock != null && daysLeft(m) <= 7); return lo.length ? 'Running low: ' + lo.map(m => `${m.name} (${daysLeft(m)} days)`).join(', ') + '.' : 'All medicines have more than a week left.' }
  if (/allerg/.test(q)) return c.profile.allergies ? `Recorded allergies: ${c.profile.allergies}.` : 'No allergies recorded yet.'
  if (/(next|when)/.test(q) && !/appoint|doctor|visit/.test(q)) {
    const n = ds.find(d => ['due', 'snoozed', 'upcoming'].includes(status(d, date)))
    return n ? `Your next dose is ${n.m.name} (${n.m.dose}) at ${t12(n.t)}.` : 'You have no more doses scheduled for today.'
  }
  if (/miss/.test(q)) { const m = ds.filter(d => status(d, date) === 'missed'); return m.length ? 'Missed today: ' + m.map(d => `${d.m.name} at ${t12(d.t)}`).join(', ') + '.' : 'No missed doses today.' }
  if (/(appoint|doctor|visit)/.test(q)) { const a = c.appts.filter(x => x.date >= date).sort(byWhen)[0]; return a ? `Next appointment: ${a.doctor} on ${a.date} at ${t12(a.time)}, ${a.place}.` : 'No upcoming appointments.' }
  if (/(adher|how am i|doing|score)/.test(q)) return `Your 7-day adherence is ${adherence(c).pct}%.`
  const m = c.meds.find(x => q.includes(x.name.toLowerCase()))
  if (m) return `${m.name}: ${m.dose}, ${m.food.toLowerCase()}, at ${m.times.map(t12).join(', ')}. ${m.notes || ''} For medical questions, please ask your doctor or pharmacist.`
  return 'Try: “When is my next dose?”, “Did I miss anything?”, “What is my blood pressure?”, “Which medicine is running low?”, or ask about a medicine by name.'
}

/* ---------- small components ---------- */
const LABEL = { taken: 'Taken', missed: 'Missed', due: 'Due now', snoozed: 'Snoozed', upcoming: 'Later' }
const Chip = ({ s, children }) => <span className={`chip ${s}`}>{children || LABEL[s]}</span>
const Field = ({ id, label, ...p }) => (<><label htmlFor={id}>{label}</label><input id={id} {...p} /></>)
const Pill = ({ color, lg }) => <span className={`pill${lg ? ' lg' : ''}`} style={{ background: PILL[color] || PILL.white }} aria-hidden="true" />
function Spark({ pts, bad }) {
  if (pts.length < 2) return null
  const mn = Math.min(...pts), mx = Math.max(...pts), w = 120, h = 36
  const p = pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - 4 - ((v - mn) / (mx - mn || 1)) * (h - 8)}`).join(' ')
  return <svg viewBox={`0 0 ${w} ${h}`} className="spark" aria-hidden="true"><polyline points={p} className={bad ? 'bad' : ''} /></svg>
}
function SunArc({ ds, label }) {
  const cx = 170, cy = 165, r = 140
  const pos = m => { const f = Math.min(1, Math.max(0, (m - 300) / 1080)), a = Math.PI * (1 - f); return [cx + r * Math.cos(a), cy - r * Math.sin(a)] }
  const [sx, sy] = pos(nowM()), done = ds.filter(d => d.s === 'taken').length
  return (
    <svg viewBox="0 0 340 190" className="arc" role="img" aria-label={`${done} of ${ds.length} ${label}`}>
      <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} className="arc-track" />
      <circle cx={sx} cy={sy} className="sunmark" />
      {ds.map(d => { const [x, y] = pos(tm(d.t)); return (<g key={d.key}>{d.s === 'due' && <circle cx={x} cy={y} r="14" className="pulse" />}<circle cx={x} cy={y} r="13" className={`dot d-${d.s}`} /><text x={x} y={y + 5} textAnchor="middle" className="dglyph">{{ taken: '✓', missed: '!', due: '•', snoozed: 'z', upcoming: '' }[d.s]}</text></g>) })}
      <text x={cx} y={cy - 48} textAnchor="middle" className="arc-n">{done}/{ds.length}</text>
      <text x={cx} y={cy - 22} textAnchor="middle" className="arc-l">{label}</text>
    </svg>)
}

/* ---------- app ---------- */
export default function App() {
  const [db, setDb] = useState(() => {
    try { const x = JSON.parse(localStorage.getItem('saathi2')); if (x?.length) return x } catch { /* first run */ }
    return [seed()]
  })
  const [ses, setSes] = useState(null)
  const [tab, setTab] = useState('today')
  const [edit, setEdit] = useState(null)
  const [big, setBig] = useState(false)
  const [lang, setLang] = useState('en')
  const [msg, setMsg] = useState('')
  const [conf, setConf] = useState(null)
  const [chat, setChat] = useState([])
  const [pc, setPc] = useState('')
  const [beat, setBeat] = useState(0)
  const [sosOn, setSosOn] = useState(false)
  const [vk, setVk] = useState('bp')
  const tRef = useRef(), qRef = useRef(), mRef = useRef()

  useEffect(() => { try { localStorage.setItem('saathi2', JSON.stringify(db)) } catch { /* private mode */ } }, [db])
  useEffect(() => { const id = setInterval(() => setBeat(b => b + 1), 30000); return () => clearInterval(id) }, [])
  useEffect(() => { document.body.classList.toggle('big', big) }, [big])

  const c = ses && db.find(x => x.id === ses.id)
  const role = ses?.role
  const today = dstr(new Date())
  const t = k => T[lang][k] || T.en[k]
  const toast = m => { setMsg(m); clearTimeout(tRef.current); tRef.current = setTimeout(() => setMsg(''), 3200) }
  const act = (y, x) => { y.activity.unshift({ at: stamp(), text: `${RN[role]}: ${x}` }); y.activity = y.activity.slice(0, 40) }
  const mut = fn => setDb(d => d.map(x => { if (x.id !== ses.id) return x; const y = structuredClone(x); fn(y); return y }))

  async function notify(cid, to, kind, subject, text) {
    let sent = false
    if (to.length) { try { sent = (await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, subject, text }) })).ok } catch { /* offline or no API */ } }
    const row = { at: stamp(), kind, to: to.join(', ') || 'no email added yet', subject, sent }
    setDb(d => d.map(x => x.id !== cid ? x : { ...x, outbox: [row, ...x.outbox].slice(0, 30) }))
  }

  // Reminder engine: upcoming dose, missed dose, low stock and appointment emails, each sent once.
  useEffect(() => {
    if (!c) return
    const n = nowM(), sent = new Set(c.sent), ev = [], miss = [], care = careTo(c), eld = [c.emails.elder].filter(Boolean)
    const push = (k, kind, to, subject, text, activity) => { if (!sent.has(k)) { sent.add(k); ev.push({ k, kind, to, subject, text, activity }) } }
    doses(c, today).forEach(d => {
      if ((!d.e || d.e.status === 'snoozed') && n > Math.max(tm(d.t) + 30, d.e?.until || 0)) miss.push(d)
      else if (!d.e && tm(d.t) - n >= 0 && tm(d.t) - n <= 10) push('up|' + d.key, 'Dose soon', eld, `Time for ${d.m.name} at ${t12(d.t)}`, `Gentle reminder: ${d.m.name} (${d.m.dose}) is due at ${t12(d.t)}.`)
    })
    c.meds.forEach(m => { if (m.stock != null && daysLeft(m) <= 5) push('refill|' + m.id, 'Refill', care, `${m.name} is running low`, `${c.elder} has about ${daysLeft(m)} days of ${m.name} left. Please arrange a refill.`, `Refill needed: ${m.name}`) })
    c.appts.forEach(a => { const h = (new Date(a.date + 'T' + a.time) - Date.now()) / 36e5; if (h > 0 && h <= 24) push('ap|' + a.id + '|' + a.date, 'Appointment', [...care, ...eld], `Appointment within 24 hours: ${a.doctor}`, `${c.elder} sees ${a.doctor} on ${a.date} at ${t12(a.time)}, ${a.place}.`, `Appointment reminder: ${a.doctor}`) })
    if (!ev.length && !miss.length) return
    mut(y => {
      miss.forEach(d => { y.log = y.log.filter(l => l.key !== d.key); y.log.push({ key: d.key, status: 'missed', by: 'system' }); y.activity.unshift({ at: stamp(), text: `System: ${y.elder} missed ${d.m.name} at ${t12(d.t)}` }) })
      ev.forEach(e => { y.sent.push(e.k); if (e.activity) y.activity.unshift({ at: stamp(), text: 'System: ' + e.activity }) })
      y.sent = y.sent.slice(-300)
    })
    miss.forEach(d => notify(c.id, care, 'Missed dose', `${c.elder} missed ${d.m.name}`, `${c.elder} has not taken ${d.m.name} (${d.m.dose}) scheduled for ${t12(d.t)}. Please check in with them.`))
    ev.forEach(e => notify(c.id, e.to, e.kind, e.subject, e.text))
  }, [beat, ses, c?.log, c?.meds, c?.appts]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ----- actions ----- */
  const login = e => {
    e.preventDefault()
    const p = pc.trim()
    for (const x of db) for (const r in x.codes) if (x.codes[r] === p) { setSes({ id: x.id, role: r }); setTab(r === 'elder' ? 'today' : 'overview'); setPc(''); return }
    toast('That passcode was not found. Check the digits and try again.')
  }
  const create = e => {
    e.preventDefault()
    const f = new FormData(e.target), s = new Set()
    while (s.size < 3) s.add(String(1000 + Math.floor(Math.random() * 9000)))
    const [a, b, d] = [...s]
    const x = { id: 'c' + Date.now(), elder: f.get('n'), emails: { elder: f.get('e'), family: f.get('f'), caretaker: f.get('t') }, codes: { elder: a, family: b, caretaker: d }, profile: { blood: '', allergies: '', conditions: '', doctor: '', doctorPhone: '' }, contacts: [], meds: [], appts: [], vitals: [], checkins: [], msgs: [], log: [], outbox: [], activity: [], sent: [] }
    setDb(v => [...v, x]); setSes({ id: x.id, role: 'caretaker' }); setTab('circle')
    toast('Care circle created. Share the passcodes below.')
  }
  const mark = (key, st) => {
    const d = doses(c, today).find(x => x.key === key)
    mut(y => {
      y.log = y.log.filter(l => l.key !== key)
      y.log.push(st === 'snoozed' ? { key, status: 'snoozed', until: nowM() + 15, by: role } : { key, status: st, by: role })
      if (st === 'taken') { const m = y.meds.find(x => x.id === d.m.id); if (m?.stock > 0) m.stock-- }
      act(y, st === 'taken' ? `marked ${d.m.name} as taken` : `snoozed ${d.m.name} for 15 minutes`)
    })
    toast(st === 'taken' ? 'Marked as taken. Well done!' : 'Reminder snoozed for 15 minutes')
  }
  const sos = () => setConf({
    text: 'Send an emergency alert to your family and caretaker?', label: 'Send alert',
    yes: () => { mut(y => act(y, 'pressed SOS')); notify(c.id, careTo(c), 'SOS', `SOS from ${c.elder}`, `${c.elder} pressed the SOS button and needs help now. Please call them immediately.`); setSosOn(true) },
  })
  const checkin = m => {
    mut(y => { y.checkins = y.checkins.filter(x => x.date !== today); y.checkins.push({ date: today, mood: m }); act(y, `checked in: feeling ${m === 'bad' ? 'unwell' : m}`) })
    if (m === 'bad') notify(c.id, careTo(c), 'Check-in', `${c.elder} is not feeling well`, `${c.elder} said they are not feeling well today. Please call and check in.`)
    toast(m === 'bad' ? 'We told your family. Please rest.' : 'Thank you for checking in!')
  }
  const sendMsg = text => { if (!text.trim()) return; mut(y => { y.msgs.unshift({ id: 'g' + Date.now(), from: role, text: text.trim().slice(0, 140), at: stamp(), seen: false }); act(y, `sent a message to ${y.elder}`) }); if (mRef.current) mRef.current.value = ''; toast('Message sent') }
  const seen = id => mut(y => { const m = y.msgs.find(x => x.id === id); if (m) m.seen = true; act(y, 'read a message ❤') })
  const saveMed = e => {
    e.preventDefault()
    const f = new FormData(e.target), times = f.get('times').split(',').map(s => s.trim()).filter(Boolean)
    if (!times.length || times.some(x => !/^([01]\d|2[0-3]):[0-5]\d$/.test(x))) return toast('Enter times like 08:00, 20:00 (24-hour)')
    const old = c.meds.find(x => x.id === edit)
    const m = { id: edit || 'm' + Date.now(), name: f.get('name'), dose: f.get('dose'), times, notes: f.get('notes'), food: f.get('food'), color: f.get('color') || 'white', stock: f.get('stock') === '' ? null : +f.get('stock'), since: old?.since || today }
    mut(y => { const i = y.meds.findIndex(x => x.id === m.id); i < 0 ? y.meds.push(m) : (y.meds[i] = m); y.sent = y.sent.filter(k => k !== 'refill|' + m.id); act(y, `${i < 0 ? 'added' : 'updated'} ${m.name}`) })
    setEdit(null); e.target.reset(); toast('Medicine saved')
  }
  const delMed = m => setConf({ text: `Remove ${m.name} from the schedule?`, label: 'Remove', yes: () => mut(y => { y.meds = y.meds.filter(x => x.id !== m.id); act(y, `removed ${m.name}`) }) })
  const saveAppt = e => {
    e.preventDefault()
    const f = new FormData(e.target), a = { id: edit || 'a' + Date.now(), doctor: f.get('doctor'), date: f.get('date'), time: f.get('time'), place: f.get('place'), notes: f.get('notes') }
    mut(y => { const i = y.appts.findIndex(x => x.id === a.id); i < 0 ? y.appts.push(a) : (y.appts[i] = a); act(y, `${i < 0 ? 'booked' : 'updated'} appointment with ${a.doctor}`) })
    setEdit(null); e.target.reset(); toast('Appointment saved')
  }
  const delAppt = a => setConf({ text: `Remove appointment with ${a.doctor}?`, label: 'Remove', yes: () => mut(y => { y.appts = y.appts.filter(x => x.id !== a.id); act(y, `removed appointment with ${a.doctor}`) }) })
  const addVital = e => {
    e.preventDefault()
    const f = new FormData(e.target), a = +f.get('a'), b = vk === 'bp' ? +f.get('b') : undefined
    if (!a || (vk === 'bp' && !b)) return toast('Enter the numbers shown on the device')
    const fl = flag(vk, a, b)
    mut(y => { y.vitals.push({ id: 'v' + Date.now(), date: today, kind: vk, a, b }); act(y, `logged ${VK[vk].n.toLowerCase()} ${fmtV({ kind: vk, a, b })}`) })
    if (fl) notify(c.id, careTo(c), 'Vitals', `${VK[vk].n} reading is ${fl.toLowerCase()} for ${c.elder}`, `${c.elder}'s ${VK[vk].n.toLowerCase()} was ${fmtV({ kind: vk, a, b })} ${VK[vk].u}, outside the usual range. This is information only; please contact the doctor if worried.`)
    e.target.reset(); toast(fl ? 'Saved. This reading is outside the usual range; your family was told.' : 'Reading saved')
  }
  const saveProfile = e => { e.preventDefault(); const f = new FormData(e.target); mut(y => { y.profile = { blood: f.get('blood'), allergies: f.get('allergies'), conditions: f.get('conditions'), doctor: f.get('doctor'), doctorPhone: f.get('doctorPhone') }; act(y, 'updated the health card') }); toast('Health card saved') }
  const addContact = e => { e.preventDefault(); const f = new FormData(e.target); mut(y => { y.contacts.push({ id: 'k' + Date.now(), name: f.get('name'), phone: f.get('phone') }); act(y, `added emergency contact ${f.get('name')}`) }); e.target.reset() }
  const delContact = k => mut(y => { y.contacts = y.contacts.filter(x => x.id !== k.id); act(y, `removed contact ${k.name}`) })
  const saveMail = e => { e.preventDefault(); const f = new FormData(e.target); mut(y => { y.emails = { elder: f.get('e'), family: f.get('f'), caretaker: f.get('t') }; act(y, 'updated alert emails') }); toast('Emails saved') }
  const onAsk = e => {
    e.preventDefault()
    const q = qRef.current.value.trim(); if (!q) return
    setChat(h => [...h, { me: 1, t: q }, { t: answer(c, q.toLowerCase()) }]); qRef.current.value = ''
  }
  const listen = () => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!R) return toast('Voice input is not available in this browser')
    const r = new R(); r.lang = 'en-IN'; r.onresult = e => { qRef.current.value = e.results[0][0].transcript; onAsk({ preventDefault() {} }) }
    r.onerror = () => toast('Could not hear you. Please try again.'); r.start(); toast('Listening…')
  }
  const go = k => { setTab(k); setEdit(null) }
  const resetDemo = () => { setDb([seed()]); setSes(null); toast('Demo data reset') }

  /* ----- views ----- */
  const vToday = () => {
    const ds = doses(c, today).map(d => ({ ...d, s: status(d, today) }))
    const n = ds.find(d => d.s === 'due' || d.s === 'snoozed') || ds.find(d => d.s === 'upcoming')
    const ap = c.appts.filter(x => x.date >= today).sort(byWhen)[0]
    const hr = new Date().getHours(), greet = t(hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening')
    const mood = c.checkins.find(x => x.date === today)?.mood
    const unseen = c.msgs.filter(m => !m.seen), low = c.meds.filter(m => m.stock != null && daysLeft(m) <= 5)
    const apWhen = ap && (ap.date === today ? 'Today' : ap.date === ago(-1) ? 'Tomorrow' : ap.date)
    return (<>
      <h1>{greet}, {c.elder.split(' ')[0]}</h1>
      <p className="mute" style={{ marginTop: 0 }}>{new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      {unseen.map(m => <div className="note" key={m.id}><b>{RN[m.from]} says:</b> {m.text}<div style={{ marginTop: '.6rem' }}><button className="pri" onClick={() => seen(m.id)}>{t('gotit')} ❤</button></div></div>)}
      <div className="card" style={{ paddingBottom: '.6rem' }}><SunArc ds={ds} label={t('taken')} /><p className="mute small" style={{ textAlign: 'center', margin: '0 0 .4rem' }}>The sun ring shows the time now.</p></div>
      <div className={`card hero${n?.s === 'due' ? ' due' : ''}`}>
        {!ds.length && <><h2>No medicines yet</h2><p>Add a medicine to start the daily schedule.</p></>}
        {ds.length > 0 && !n && <><h2>{t('done')}</h2><p>Every dose is recorded. Rest well.</p></>}
        {n?.s === 'due' && <><h2><Pill color={n.m.color} lg />{n.m.name}</h2><p>{n.m.dose} · {n.m.food.toLowerCase()} · scheduled {t12(n.t)}</p>
          <div className="row"><button className="sun" onClick={() => mark(n.key, 'taken')}>{t('took')}</button>
            <button onClick={() => mark(n.key, 'snoozed')}>{t('snooze')}</button>
            <button onClick={() => speak(`${n.m.name}. ${n.m.dose}. ${n.m.food}`, lang)}>{t('aloud')}</button></div></>}
        {n && n.s !== 'due' && <><h2><Pill color={n.m.color} lg />{t('next')}: {n.m.name}</h2><p>{t12(n.t)} · {n.m.dose} · {n.m.food.toLowerCase()}{n.s === 'snoozed' ? ' · snoozed' : ''}</p></>}
      </div>
      <div className="card"><h3>{t('feel')}</h3>
        <div className="row moods">{[['good', '😊'], ['okay', '😐'], ['bad', '😟']].map(([k, e]) => <button key={k} className={k === 'bad' ? 'bad' : ''} aria-pressed={mood === k} onClick={() => checkin(k)}><span className="em">{e}</span>{t(k)}</button>)}</div></div>
      {low.map(m => <div className="note" key={m.id}><b>{m.name} is running low</b> · about {daysLeft(m)} days left. Ask family to arrange a refill.</div>)}
      <div className="card"><h3>{t('today')}</h3>
        {ds.map(d => <div className="item" key={d.key}><span className="time">{t12(d.t)}</span><Pill color={d.m.color} /><span className="grow"><b>{d.m.name}</b> <span className="mute">{d.m.dose} · {d.m.food.toLowerCase()}</span></span><Chip s={d.s} /></div>)}
        {!ds.length && <p className="mute">Nothing scheduled.</p>}</div>
      <div className="grid">
        <div className="card"><h3>Next appointment</h3>{ap ? <><b>{ap.doctor}</b> {apWhen !== ap.date && <Chip s="due">{apWhen}</Chip>}<br />{ap.date} at {t12(ap.time)}<br /><span className="mute">{ap.place}</span></> : <p className="mute">None booked.</p>}</div>
        <div className="card alert"><h3>Need help now?</h3>
          {sosOn ? <><p><b>Alert sent.</b> Call someone now:</p><div className="row">{c.contacts.map(k => <a key={k.id} className="call" href={`tel:${k.phone.replace(/\s/g, '')}`}>Call {k.name.split(' ')[0]}</a>)}<a className="call" href="tel:108">Ambulance 108</a></div><p><button className="ghost" onClick={() => setSosOn(false)}>I am safe now</button></p></>
            : <><p className="mute">Alerts your family and caretaker by email.</p><button className="red" style={{ minHeight: 68, fontSize: '1.3rem' }} onClick={sos}>{t('sos')}</button></>}</div>
      </div></>)
  }
  const vOver = () => {
    const a = adherence(c), ms = doses(c, today).filter(d => status(d, today) === 'missed'), sk = streak(c)
    const mood = c.checkins.find(x => x.date === today)?.mood, flagged = c.vitals.filter(v => v.date >= ago(3) && flag(v.kind, v.a, v.b))
    const low = c.meds.filter(m => m.stock != null && daysLeft(m) <= 5)
    const quick = ['Call me when you are free', 'Have you eaten?', 'Please take your medicine']
    return (<>
      <div className="grid">
        <div className="card"><h3>7-day adherence</h3>
          <div className="big-n" style={{ color: a.pct < 80 ? 'var(--sindoor)' : 'var(--tulsi)' }}>{a.pct}%</div><p className="mute">of scheduled doses taken{sk > 0 && <> · <b>{sk}-day streak</b></>}</p>
          <div className="bars">{a.days.map((d, i) => <div className="bar" key={i}><i className={d.b && d.a / d.b < 0.8 ? 'lo' : ''} style={{ height: d.b ? Math.max(4, d.a / d.b * 90) : 4 }} />{d.l}</div>)}</div></div>
        <div className="card"><h3>Today for {c.elder}</h3>
          <p>Mood: {mood ? <Chip s={mood === 'bad' ? 'missed' : 'taken'}>{{ good: '😊 Good', okay: '😐 Okay', bad: '😟 Not well' }[mood]}</Chip> : <span className="mute">no check-in yet</span>}</p>
          {ms.map(d => <p key={d.key}><Chip s="missed" /> {d.m.name} at {t12(d.t)}</p>)}
          {!ms.length && <p><Chip s="taken">On track</Chip> No missed doses today.</p>}
          {low.map(m => <p key={m.id}><Chip s="missed">Low stock</Chip> {m.name}: {daysLeft(m)} days left</p>)}
          {flagged.map(v => <p key={v.id}><Chip s={flag(v.kind, v.a, v.b)}>{flag(v.kind, v.a, v.b)}</Chip> {VK[v.kind].n} {fmtV(v)} on {v.date}</p>)}</div>
      </div>
      <div className="card"><h3>What the week shows</h3><p>{insight(c)}</p><button onClick={() => go('summary')}>Open doctor-visit summary</button></div>
      <div className="card"><h3>Send {c.elder.split(' ')[0]} a message</h3><p className="mute small">It appears on their Today screen until they tap “Got it”.</p>
        <div className="row" style={{ marginBottom: '.6rem' }}>{quick.map(q => <button key={q} className="ghost" onClick={() => sendMsg(q)}>{q}</button>)}</div>
        <form className="row" onSubmit={e => { e.preventDefault(); sendMsg(mRef.current.value) }}><div className="grow"><label className="vh" htmlFor="gm">Message</label><input id="gm" ref={mRef} maxLength={140} placeholder="Write a short message" autoComplete="off" /></div><button className="pri">Send</button></form></div>
      <div className="card"><h3>Activity</h3>
        {c.activity.slice(0, 12).map((x, i) => <div className="item" key={i}><span className="mute time" style={{ minWidth: '9rem' }}>{x.at}</span>{x.text}</div>)}
        {!c.activity.length && <p className="mute">No activity yet.</p>}</div>
      <div className="card"><h3>Email log</h3>
        {c.outbox.map((x, i) => <div className="item" key={i}><span className="grow"><b>{x.subject}</b><br /><span className="mute small">{x.at} · to {x.to}</span></span><Chip s={x.sent ? 'taken' : 'snoozed'}>{x.sent ? 'Sent' : 'Queued (demo mode)'}</Chip></div>)}
        {!c.outbox.length && <p className="mute">Reminder and alert emails appear here.</p>}</div></>)
  }
  const vMeds = () => {
    const e = c.meds.find(x => x.id === edit) || {}
    return (<>
      <h1>{t('meds')}</h1>
      <div className="card">
        {c.meds.map(m => { const dl = daysLeft(m); return (<div className="item" key={m.id}><Pill color={m.color} lg /><span className="grow"><b>{m.name}</b> · {m.dose} <Chip s="info">{m.food}</Chip><br /><span className="mute">{m.times.map(t12).join(', ')} {m.notes}</span>
          {dl != null && <><div className="stock" aria-hidden="true"><i className={dl <= 5 ? 'lo' : ''} style={{ width: Math.min(100, dl / 30 * 100) + '%' }} /></div><span className={`small ${dl <= 5 ? 'lowtxt' : 'mute'}`}>{m.stock} left · about {dl} days</span></>}</span>
          <button className="ghost" onClick={() => setEdit(m.id)}>Edit</button><button className="ghost" onClick={() => delMed(m)}>Remove</button></div>) })}
        {!c.meds.length && <p className="mute">No medicines yet. Add the first one below.</p>}</div>
      <form className="card" key={edit || 'new'} onSubmit={saveMed}><h3>{e.id ? 'Edit medicine' : 'Add a medicine'}</h3>
        <Field id="mn" label="Name" name="name" required defaultValue={e.name} />
        <Field id="md" label="Dose, as written on the prescription" name="dose" required defaultValue={e.dose} />
        <Field id="mt" label="Times (24-hour, comma separated)" name="times" required defaultValue={e.times?.join(', ')} placeholder="08:00, 20:00" />
        <label htmlFor="mf">When to take</label><select id="mf" name="food" defaultValue={e.food || 'Any time'}>{['Any time', 'Before food', 'After food', 'With food'].map(x => <option key={x}>{x}</option>)}</select>
        <Field id="ms" label="Pills left (for refill alerts)" name="stock" type="number" min="0" defaultValue={e.stock ?? ''} />
        <label>Pill colour</label><div role="radiogroup" aria-label="Pill colour">{Object.entries(PILL).map(([k, v]) => <label className="sw" key={k} style={{ margin: '.2rem' }}><input type="radio" name="color" value={k} defaultChecked={(e.color || 'white') === k} aria-label={k} /><span style={{ background: v }} /></label>)}</div>
        <Field id="mo" label="Notes" name="notes" defaultValue={e.notes} />
        <div className="row" style={{ marginTop: '1rem' }}><button className="pri">Save medicine</button>{e.id && <button type="button" onClick={() => setEdit(null)}>Cancel</button>}</div></form></>)
  }
  const vHealth = () => {
    const p = c.profile
    return (<>
      <h1>{t('health')}</h1>
      <div className="grid">{Object.keys(VK).map(k => { const L = latest(c, k), l = L[L.length - 1], fl = l && flag(k, l.a, l.b); return (
        <div className="card" key={k}><h3>{VK[k].n}</h3>{l ? <><div className="big-n" style={{ fontSize: '2.4rem' }}>{fmtV(l)} <span className="small mute">{VK[k].u}</span></div><p className="small mute" style={{ margin: '.2rem 0' }}>{l.date} {fl && <Chip s={fl}>{fl}</Chip>}</p><Spark pts={L.slice(-7).map(v => v.a)} bad={!!fl} /></> : <p className="mute">No readings yet.</p>}</div>) })}</div>
      <form className="card" onSubmit={addVital}><h3>Log a reading</h3>
        <label htmlFor="vk">What did you measure?</label><select id="vk" value={vk} onChange={e => setVk(e.target.value)}>{Object.entries(VK).map(([k, v]) => <option key={k} value={k}>{v.n} ({v.u})</option>)}</select>
        <div className="grid"><div><Field id="va" label={vk === 'bp' ? 'Upper number' : 'Reading'} name="a" type="number" step="any" required /></div>{vk === 'bp' && <div><Field id="vb" label="Lower number" name="b" type="number" required /></div>}</div>
        <p className="mute small">Information only. Outside-range readings are flagged and your family is told. Always follow your doctor’s advice.</p>
        <button className="pri">Save reading</button></form>
      <form className="card" onSubmit={saveProfile}><h3>Health card</h3><p className="mute small">Shown to the doctor in the visit summary.</p>
        <Field id="hb" label="Blood group" name="blood" defaultValue={p.blood} /><Field id="ha" label="Allergies" name="allergies" defaultValue={p.allergies} /><Field id="hc" label="Conditions" name="conditions" defaultValue={p.conditions} />
        <Field id="hd" label="Doctor" name="doctor" defaultValue={p.doctor} /><Field id="hp" label="Doctor phone" name="doctorPhone" type="tel" defaultValue={p.doctorPhone} />
        <button className="pri" style={{ marginTop: '1rem' }}>Save health card</button></form>
      <div className="card"><h3>Emergency contacts</h3>
        {c.contacts.map(k => <div className="item" key={k.id}><span className="grow"><b>{k.name}</b><br /><span className="mute">{k.phone}</span></span><a className="call alt" href={`tel:${k.phone.replace(/\s/g, '')}`}>Call</a><button className="ghost" onClick={() => delContact(k)}>Remove</button></div>)}
        <form className="row" onSubmit={addContact} style={{ marginTop: '.8rem' }}><div className="grow"><label className="vh" htmlFor="kn">Name</label><input id="kn" name="name" placeholder="Name and relation" required /></div><div className="grow"><label className="vh" htmlFor="kp">Phone</label><input id="kp" name="phone" type="tel" placeholder="Phone number" required /></div><button className="pri">Add</button></form></div>
      <button onClick={() => go('summary')}>Open doctor-visit summary</button></>)
  }
  const vAppts = () => {
    const e = c.appts.find(x => x.id === edit) || {}
    return (<>
      <h1>{t('visits')}</h1>
      <div className="card">
        {[...c.appts].sort(byWhen).map(a => <div className="item" key={a.id} style={{ opacity: a.date < today ? 0.55 : 1 }}><span className="grow"><b>{a.doctor}</b><br />{a.date} at {t12(a.time)} · {a.place}<br /><span className="mute">{a.notes}</span></span>
          <button className="ghost" onClick={() => setEdit(a.id)}>Edit</button><button className="ghost" onClick={() => delAppt(a)}>Remove</button></div>)}
        {!c.appts.length && <p className="mute">No appointments yet.</p>}</div>
      <form className="card" key={edit || 'new'} onSubmit={saveAppt}><h3>{e.id ? 'Edit appointment' : 'Add an appointment'}</h3>
        <Field id="ad" label="Doctor" name="doctor" required defaultValue={e.doctor} />
        <div className="grid"><div><Field id="ada" label="Date" type="date" name="date" required defaultValue={e.date} /></div><div><Field id="adt" label="Time" type="time" name="time" required defaultValue={e.time} /></div></div>
        <Field id="ap" label="Place" name="place" defaultValue={e.place} /><Field id="an" label="Notes" name="notes" defaultValue={e.notes} />
        <p className="mute small">An email reminder goes out 24 hours before.</p>
        <div className="row"><button className="pri">Save appointment</button>{e.id && <button type="button" onClick={() => setEdit(null)}>Cancel</button>}</div></form></>)
  }
  const vAsk = () => (
    <div className="card chat"><h1>{t('ask')}</h1><p className="mute">Answers from your recorded schedule and readings. It never changes medicines or doses.</p>
      {chat.map((m, i) => <p key={i} className={m.me ? 'me' : ''}>{m.t}</p>)}
      <form className="row" onSubmit={onAsk} style={{ marginTop: '1rem' }}>
        <div className="grow"><label className="vh" htmlFor="q">Your question</label><input id="q" ref={qRef} placeholder="When is my next dose?" autoComplete="off" /></div>
        <button type="button" onClick={listen} aria-label="Speak your question">🎤</button><button className="pri">Ask</button></form></div>)
  const vCircle = () => (<>
    <h1>{t('circle')}</h1>
    <div className="card"><h3>Passcodes</h3><p className="mute">Share each passcode only with that person.</p>
      {Object.entries(c.codes).map(([r, p]) => <div className="item" key={r}><span className="grow"><b>{RN[r]}</b></span><span className="big-n" style={{ fontSize: '1.8rem' }}>{p}</span></div>)}</div>
    <form className="card" onSubmit={saveMail}><h3>Who gets email reminders</h3><p className="mute small">The elder gets dose and appointment reminders. Family and caretaker get missed-dose, SOS, vitals, refill and check-in alerts.</p>
      <Field id="ee" label="Elder email" type="email" name="e" defaultValue={c.emails.elder} />
      <Field id="ef" label="Family email" type="email" name="f" defaultValue={c.emails.family} />
      <Field id="et" label="Caretaker email" type="email" name="t" defaultValue={c.emails.caretaker} />
      <button className="pri" style={{ marginTop: '1rem' }}>Save emails</button></form></>)
  const vSummary = () => {
    const a = adherence(c), p = c.profile
    return (<>
      <div className="row noprint" style={{ marginBottom: '1rem' }}><button className="pri" onClick={() => window.print()}>Print or save as PDF</button><button onClick={() => go(role === 'elder' ? 'health' : 'overview')}>Back</button></div>
      <h1>Health summary: {c.elder}</h1><p className="mute">Prepared {new Date().toLocaleDateString([], { dateStyle: 'long' })} for the doctor. Information recorded by the care circle, not a medical record.</p>
      <div className="card"><h3>Health card</h3><p>Blood group: {p.blood || '–'}<br />Allergies: {p.allergies || '–'}<br />Conditions: {p.conditions || '–'}<br />Doctor: {p.doctor || '–'} {p.doctorPhone}</p></div>
      <div className="card"><h3>Current medicines</h3>{c.meds.map(m => <p key={m.id} style={{ margin: '.3rem 0' }}><b>{m.name}</b> {m.dose}, {m.food.toLowerCase()}, at {m.times.map(t12).join(', ')}</p>)}{!c.meds.length && <p className="mute">None recorded.</p>}</div>
      <div className="card"><h3>Adherence, last 7 days: {a.pct}%</h3><p>{a.days.map(d => `${d.l} ${d.a}/${d.b}`).join(' · ')}</p></div>
      <div className="card"><h3>Readings, last 7 days</h3>{Object.keys(VK).map(k => { const L = latest(c, k).slice(-7); return L.length ? <p key={k} style={{ margin: '.3rem 0' }}><b>{VK[k].n}</b> ({VK[k].u}): {L.map(fmtV).join(', ')}</p> : null })}</div>
      <div className="card"><h3>Upcoming visits</h3>{c.appts.filter(x => x.date >= today).sort(byWhen).map(x => <p key={x.id} style={{ margin: '.3rem 0' }}>{x.date} {t12(x.time)}: {x.doctor}, {x.place}</p>)}</div></>)
  }

  const overlay = (<>
    {msg && <div id="toast" role="status">{msg}</div>}
    {conf && <div className="modal" role="dialog" aria-modal="true" aria-label="Confirm"><div className="card"><h3>{conf.text}</h3>
      <div className="row"><button className="red" onClick={() => { conf.yes(); setConf(null) }}>{conf.label}</button><button onClick={() => setConf(null)}>Keep it</button></div></div></div>}
  </>)

  /* ----- screens ----- */
  if (!c) return (<>
    <div className="wrap login"><h1>SaathiCare</h1><p>One shared care circle for the elder, family and caretaker. Enter your passcode.</p>
      <form className="card" onSubmit={login}><label htmlFor="pc">Passcode</label>
        <input id="pc" inputMode="numeric" autoComplete="off" maxLength={6} required value={pc} onChange={e => setPc(e.target.value)} style={{ fontSize: '2rem', letterSpacing: '.3em' }} />
        <button className="pri" style={{ marginTop: '1rem', width: '100%' }}>Open my care circle</button></form>
      <div className="card"><b>Try the demo</b><p className="mute" style={{ margin: '.3rem 0' }}>Elder 1111 · Family 2222 · Caretaker 3333</p>
        <div className="row"><button onClick={() => setPc('1111')}>Fill elder</button><button onClick={() => setPc('3333')}>Fill caretaker</button><button className="ghost" onClick={resetDemo}>Reset demo data</button></div></div>
      <details className="card"><summary><b>Create a new care circle</b></summary>
        <form onSubmit={create}><Field id="cn" label="Elder’s name" name="n" required /><Field id="ce" label="Elder email (dose reminders)" name="e" type="email" /><Field id="cf" label="Family email for alerts" name="f" type="email" /><Field id="ct" label="Caretaker email for alerts" name="t" type="email" />
          <button className="pri" style={{ marginTop: '1rem' }}>Create circle</button></form></details>
    </div>{overlay}</>)

  const IC = { today: '🏠', overview: '👪', meds: '💊', health: '❤️', appts: '📅', ask: '💬', circle: '🔑' }
  const tabs = role === 'elder'
    ? [['today', t('today')], ['meds', t('meds')], ['health', t('health')], ['appts', t('visits')], ['ask', t('ask')]]
    : [['overview', t('overview')], ['today', t('today')], ['meds', t('meds')], ['health', t('health')], ['appts', t('visits')], ['ask', t('ask')], ['circle', t('circle')]]
  const view = { today: vToday, overview: vOver, meds: vMeds, health: vHealth, appts: vAppts, ask: vAsk, circle: vCircle, summary: vSummary }[tab]
  return (<>
    <header><div className="wrap"><span className="brand"><i />SaathiCare</span><span>{c.elder} · {RN[role]}</span><span className="sp" />
      <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} aria-label="Switch language between English and Hindi">{lang === 'en' ? 'हिन्दी' : 'English'}</button>
      <button onClick={() => setBig(!big)} aria-pressed={big} aria-label="Toggle larger text">A+</button><button onClick={() => { setSes(null); setEdit(null); setSosOn(false) }}>Exit</button></div></header>
    <main className="wrap"><nav className="tabs" aria-label="Sections">{tabs.map(([k, l]) => <button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}><span className="ic" aria-hidden="true">{IC[k === 'appts' ? 'appts' : k]}</span><span>{l}</span></button>)}</nav>{view()}</main>
    {overlay}</>)
}
