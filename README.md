# SaathiCare: your health, your family, one connected care system

Elder-first healthcare companion for Catalyst x PromptWars (Elderly Care & Assisted Living).

**Live:** add your Vercel URL here  |  **Demo passcodes:** elder `1111`, family `2222`, caretaker `3333`

## Features
- **Passcode access, three roles** (elder, family, caretaker) sharing one care circle
- **Sun-path dose dial**: the day as an arc with each dose as a dot (taken, due, missed), pulsing when due
- **Elder-first Today screen**: big "I took it", snooze, read aloud, A+ text size, Hindi/English switch, daily mood check-in
- **Medicines**: multiple daily times, with/before/after food, pill colour, pill count with refill alerts
- **Vitals**: log blood pressure, sugar, pulse and weight with trend lines; out-of-range readings alert family (information only)
- **Health card and emergency contacts**: one-tap call buttons appear after SOS, plus ambulance 108
- **Family messages**: family sends a short note that shows on the elder's Today screen until acknowledged
- **Email reminders** (Resend): dose due soon, missed dose, low stock, appointment within 24 hours, SOS, "not feeling well", flagged vitals; each sent once, with a visible email log
- **Insights**: 7-day adherence, streak, which time of day is missed most
- **Doctor-visit summary**: printable page (medicines, adherence, readings, health card)
- **Care assistant** with voice input; answers from recorded data and never changes doses

## Stack
React 18 + Vite, Vercel serverless function (`api/notify.js`), Resend for email, browser localStorage for data.

## Run
`npm install && npm run dev`. Deploy by importing the repo on Vercel (Vite is auto-detected). Set `RESEND_API_KEY` (optional `MAIL_FROM`) in Vercel for real emails; without it alerts show as "Queued (demo mode)".

## 3-minute demo script
1. Enter `3333` (caretaker), Health: log blood pressure 165/98 (family is alerted). Medicines: add a medicine due 2 minutes from now with 4 pills left (refill alert).
2. Open a second tab with `1111` (elder). When due, tap Taken or Snooze.
3. As caretaker send a message; as elder tap Got it, tap Not well, press SOS and see call buttons. Check the Email log on Overview.
4. Ask the assistant "when is my next dose?" then "should I change my dose?"

## Limits and next steps
Data lives in browser localStorage. Next: Supabase for sync across devices, and a cron job so reminders go out when no one has the app open.

## LinkedIn post template
Built SaathiCare in a few hours for the Catalyst hackathon by @Makers Need More (MnM) and PromptWars: an elder-first care circle where seniors, family and caretakers share medicine schedules, appointments and missed-dose alerts. Problem: Elderly Care & Assisted Living. Live: <url> Code: <repo> #Catalyst #PromptWars #MnM
