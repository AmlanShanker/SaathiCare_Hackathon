# SaathiCare — Elder-first care coordination

SaathiCare is a hackathon prototype for an elderly person, their family and a caretaker to coordinate medication schedules, appointments, check-ins and care alerts.

**Live demo:** https://saathicare-five.vercel.app/  
**Repository:** https://github.com/AmlanShanker/SaathiCare_Hackathon

## Demo access

- Elder: `1111`
- Family: `2222`
- Caretaker: `3333`

These are demo credentials only. Do not use them for real patient information.

## What the prototype demonstrates

- Three role-based views for an elder, family member and caretaker.
- Medication schedules, dose status, snooze and adherence summaries.
- Appointment planning and reminders.
- Health readings, emergency contacts and mood check-ins.
- Family messages, care activity and an in-app email event log.
- English/Hindi labels, read-aloud support and larger-text mode.
- A rule-based care assistant that answers from recorded information and directs medication-change questions to a clinician.

## Technology

React 18, Vite 5, CSS, browser `localStorage`, and a Vercel serverless email endpoint using Resend when configured.

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm test
npm run build
```

The test suite exercises the medication schedule, dose-status transitions, adherence calculation, time validation, stock estimates and vital-reading flags. GitHub Actions runs the tests and production build on pushes and pull requests.

## Email configuration

Set `RESEND_API_KEY`, `APP_ORIGIN=https://saathicare-five.vercel.app` and (optionally) `MAIL_FROM` in Vercel Project Settings → Environment Variables. The notification endpoint validates the request origin, recipient addresses and message size, and applies a per-instance rate limit. Never put the API key in a `VITE_*` variable or client-side source. Email sending requires a sender address permitted by your Resend account; a verified domain is recommended for production.

## Important prototype limitations

- Care-circle data is stored in the current browser's `localStorage`. It is not synchronised across devices or users, and clearing browser storage can erase it.
- Demo vitals and historical adherence entries are synthetic sample data, not real clinical measurements.
- The passcodes are demo access gates, not production authentication. This prototype must not be used to store real patient data or make clinical decisions.
- Email reminders run while the app is open; dependable background reminders require a scheduled server-side job and persistent shared storage.
- The care assistant is rule-based and informational, not a medical professional or diagnostic system.

## Demo walkthrough

1. Sign in as caretaker (`3333`) and review the care circle.
2. Inspect the medicine schedule, adherence summary and sample health readings.
3. Switch to the elder view (`1111`) to mark a dose, snooze a reminder or use read-aloud.
4. Return to the caretaker view to review activity, messages and the email event log.
5. Try a medication-change question in the care assistant to see its safety boundary.

## Accessibility and design

The interface uses Atkinson Hyperlegible, responsive layouts, large touch targets, visible keyboard focus, labelled form fields, reduced-motion handling and an optional larger-text mode.
