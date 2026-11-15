# SaathiCare: Judge-Verified Plan (Catalyst x PromptWars, Elderly Care)

Deadline: submission closes 5:00 PM IST, 15 Nov 2026. Solo, free, one build.

## 1. Judge's scorecard (what I would mark)

| Criterion | Weight | What earns full marks | Our answer |
|---|---|---|---|
| Implementation | 20% | Real code, real data flow, not mock screens | Working CRUD, persisted state, serverless email endpoint |
| Problem-solution alignment | 20% | Passcode access, meds, adherence, appointments, email reminders, elder at centre | Three passcode roles, every item in the brief mapped to a screen |
| Functionality | 20% | Features work live in a 3-minute demo | Taken/Snooze/auto-missed, SOS, edits by family, email log |
| UI/UX | 15% | Readable by an 80-year-old, responsive | Atkinson Hyperlegible, 18px base, text size toggle, read aloud, 48px+ targets |
| Deployment | 10% | Live URL that opens first time | React (Vite) build + one `/api` function on Vercel |
| GitHub | 5% | Clear README, tidy tree | README with demo script and honest limits |
| LinkedIn | 10% | Problem, demo, tag MnM | Post template in README |

Differentiators beyond a reminder app: elder-first "Today" screen, SOS alert, 7-day adherence insights, activity feed showing who changed what, safe care assistant that refuses to change doses.

## 2. Skills required

1. Product scoping (cut to what is demonstrable in 3 minutes)
2. Accessible UI design for older adults (contrast, size, simple language)
3. Frontend JavaScript (state, rendering, time logic)
4. Serverless API and email delivery (Vercel function + Resend)
5. Data modelling (circle, medicines, appointments, dose log)
6. Safe AI/assistant design (informational only)
7. Deployment (GitHub to Vercel) and README writing
8. Storytelling (LinkedIn post, demo script)

## 3. Judge verification of the first draft (issues found and fixed)

| Issue found | Fix in final plan |
|---|---|
| Supabase needs keys and setup; high risk with hours left | React + Vite front end with browser storage; Vercel builds it automatically, no extra services |
| Gemini key adds failure point | Rule-based assistant over the real data; Gemini is a documented upgrade |
| Passcodes with one shared role is weak | Separate elder, family, caretaker passcodes with different views |
| Email reminders with no backend is fake | `/api/notify` calls Resend; app shows an email log with Sent or Queued status |
| Elder could feel sidelined | Elder gets the simplest screen and every change by others is logged and visible |
| AI changing doses is unsafe | Assistant never edits medicines and tells users to ask a doctor |

## 4. One-time execution plan (frozen)

1. Create the React + Vite project: `src/App.jsx`, `src/main.jsx`, `src/index.css`, `api/notify.js`, `README.md`.
2. Push to GitHub (public repo `saathicare`).
3. Import repo on Vercel, add env `RESEND_API_KEY` (and optional `MAIL_FROM`), deploy.
4. Run the demo script in README once on the live URL; screenshot it.
5. Publish LinkedIn post tagging Makers Need More (MnM); paste repo, live URL and post link into the submission form before 5:00 PM.

## 5. Known limits (stated up front)

Data is stored in the browser (localStorage), so circles do not sync across devices yet. Next step is Supabase tables for circles, medicines, appointments and dose logs plus a Vercel cron for reminders when the app is closed. Resend's test sender only delivers to your own account email until a domain is verified.
