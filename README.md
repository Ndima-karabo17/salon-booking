# Sbongile's Hair Salon: Online Booking

A booking and deposit tool for a braiding salon in Seshego, Polokwane.
Built for the Samsung Innovation Internship 2027 entry assignment (Route A).

**Live link:** https://salon-booking-uf5f.vercel.app/

## The problem
The salon runs on a paper notebook. Stylists stop braiding to check who is
next, no-shows cost the salon time with nothing securing a slot, and the
owner cannot prove who has paid a deposit if the notebook is lost.
Research notes with the owner's and stylist's own words are in
`docs/salon-research-notes.docx`.

## Test access (all data is made up)
No setup is needed. Open the live link and log in at `/login`
(the "Log in" link is at the bottom of the home page).

| Role       | Email                  | Password   |
|------------|------------------------|------------|
| Owner  Test | owner@salon-test.com   | ownertest |
| Stylist Test | stylist@salon-test.com | stylisttest |
| Client Test | client@salon-test.com  | clienttest |

You can also create your own client account with the "Create account" link.
New accounts are always clients. Only the database owner can grant staff roles.

The database already holds a few made-up bookings, so every screen has data.

## What to try, by role

**Anyone (no login)**
The home page shows the salon's styles, prices and durations, how booking
works, and the location on a map.

**Client**
1. Log in and click "Book an appointment".
2. Choose a style, a date and a start time. Times are crossed out if the style
   would run past closing (19:00), the time has passed, or the salon is full.
3. Book. You get a reference (SALON-n) and the deposit amount.
4. "Your bookings" shows status, deposit and any change made by the salon.

**Owner**
1. Log in and click "View bookings".
2. Tabs: Today, Upcoming, Unpaid deposits, Past.
3. "Confirm deposit paid" records the method (cash or transfer), reference and
   time. "Undo deposit" reverses a mistake.
4. "Reschedule" moves a booking, for example when a walk-in arrives.
   The deposit stays with the booking, and the original time is shown.
5. Arrived, Done, No-show and Cancel track each booking through the day.

**Stylist**
Same page as the owner and can also reschedule and track bookings, but cannot
confirm or undo deposits (the owner handles money).

## Feedback from the owner
After trying the live app, the owner wrote on 17 November 2026:
"Can you please add the reschedule and to confirm if they did pay deposit".
Both were added: rescheduling for staff, and deposit confirmation that records
how and when the deposit was paid.

## Design decisions
- **Capacity:** the owner said two clients can be served at once, so the
  database allows two overlapping bookings. Each booking's end time is worked
  out from the style's duration (braids 3h, most styles 1h, washes and
  relaxers 40 min).
- **No online payments:** the salon takes cash or transfer, so the app records
  that a deposit was paid instead of processing payments.
- **Security:** Supabase row-level security. Clients see only their own
  bookings. A database rule stops stylists changing deposits, and the database,
  not just the page, enforces capacity. Staff roles can only be set in the
  database, never through signup.
- **Free to run:** Next.js on Vercel, Supabase free tier. A scheduled GitHub
  Action pings the database every 3 days so it does not pause.

## Tech
Next.js (React), Tailwind CSS, Supabase (Postgres and Auth), Vercel,
GitHub Actions.

## Known limits (what I would build next)
- Walk-ins are not recorded in the app, so a walk-in's chair time still shows
  as free to online clients.
- Clients cannot choose a stylist, because the salon is booked by chair time.
- No reminders to clients (for example WhatsApp) before their slot.
- Clients cannot yet request a cancellation or reschedule themselves.
- Prices, durations and deposits are the owner's figures, and some durations
  are estimates.
- Stock tracking, which the owner currently does by calling her supplier.

## Data
No real personal data is used. All names, emails and bookings are test data.
