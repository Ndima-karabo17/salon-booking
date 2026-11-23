# Sbongile's Hair Salon: Online Booking

A booking, deposit and daily-calendar tool for a braiding salon in Seshego, Polokwane.
Built for the Samsung Innovation Internship 2027 entry assignment (Route A).

**Live link:** https://salon-booking-uf5f.vercel.app/

## The problem
The salon runs on a paper notebook. Stylists stop braiding to check who is
next, no-shows cost the salon time with nothing securing a slot, and the
owner cannot prove who has paid a deposit if the notebook is lost.
Research notes with the owner's and stylist's own words are in
`docs/salon-research-notes.docx`. The written walkthrough is in
`docs/walkthrough.docx`.

## Test access (all data is made up)
No setup is needed. Open the live link and log in at `/login`
(use "Log in" in the top bar).

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Owner   | owner@salon-test.com   | ownertest |
| Stylist | stylist@salon-test.com | stylisttest |
| Client  | client@salon-test.com  | clienttest |

You can also create your own client account with the "Create account" link.
New accounts are always clients. Only the database owner can grant staff roles.

The database already holds made-up bookings, so every screen has data.
All phone numbers in the test data are fake, so the WhatsApp buttons open no
real chat. If you book as a client, please use a made-up name and number.

## What to try, by role

**Anyone (no login)**
The home page shows a gallery of the salon's work, the styles with photos,
prices and durations, how booking works, and the location on a map. The top
bar links to Home, Our work, Services and Booking slots.

**Client**
1. Log in and open "Booking slots".
2. Choose a style. A preview shows its photo, price, duration and the latest
   time it can start.
3. Pick a date from the calendar strip (past days cannot be chosen), then a
   start time. Times are greyed out and labelled Past, Full or Too late.
   A style that would run past closing (19:00) cannot start late in the day.
4. Enter a WhatsApp number (use a made-up one) and, for styles with a deposit,
   tick that the deposit is non-refundable.
5. Book. You get a reference (SALON-n) and the deposit amount.
6. "Your bookings" shows status, deposit and any change made by the salon.

**Owner**
1. Log in. The top bar now shows "Calendar" and "Bookings".
2. **Calendar:** a day timeline from 07:00 to 19:00. Each booking is a block
   as long as the style, with two chairs side by side, the deposit status and
   a line for the current time.
3. **Bookings:** tabs for Today, Upcoming, Unpaid deposits and Past.
4. "Confirm deposit paid" records the method (cash or transfer), reference and
   time. "Undo deposit" reverses a mistake.
5. "Reschedule" moves a booking, for example when a walk-in arrives. The
   deposit stays with the booking and the original time is shown.
6. "+ Add walk-in" puts a walk-in in the chair and blocks that time for online
   clients.
7. Arrived, Done, No-show and Cancel track each booking through the day.
8. "WhatsApp client" opens WhatsApp with a ready message when a client is late
   or did not show up.

**Stylist**
Same pages as the owner, and can also reschedule, add walk-ins, track bookings
and WhatsApp clients, but cannot confirm or undo deposits (the owner handles
money).

## Feedback that shaped the product
- **Owner, 17 November 2026**, after trying the live link:
  "Can you please add the reschedule and to confirm if they did pay deposit".
  Both were added: rescheduling by staff, and deposit confirmation that records
  how and when the deposit was paid.
- **Clients** asked for pictures of the hairstyles, so the home page has a
  gallery and each style shows a photo where one is available.
- **A UI/UX designer** suggested a navbar with Home and Booking slots, and a
  calendar showing the day's bookings. Both were added.

## Design decisions
- **Capacity:** the stylist said two clients are sometimes done together, so
  the database allows two overlapping bookings. Each booking's end time is
  worked out from the style's duration (braids 3h, most styles 1h, washes and
  relaxers 40 min).
- **Opening hours:** 07:00 to 19:00. The database refuses a booking that
  starts in the past or whose style would finish after closing. This is
  enforced in the database, not just on the page. Staff walk-ins are exempt.
- **Deposits are non-refundable:** this is shown on the booking page, the
  confirmation and the home page. The client must tick that they understand,
  and the time they ticked is saved.
- **No online payments:** the salon takes cash or transfer, so the app records
  that a deposit was paid instead of processing payments.
- **WhatsApp, kept simple:** a click-to-chat link with a ready message, so it
  is free and needs no paid API. The number is stored on the booking, so only
  that client and the staff can see it.
- **Security:** Supabase row-level security. Clients see only their own
  bookings. Database rules stop stylists changing deposits and stop clients
  inserting anything but their own pending bookings. Staff roles can only be
  set in the database, never through signup.
- **Free to run:** Next.js on Vercel, Supabase free tier. A scheduled GitHub
  Action pings the database every 3 days so it does not pause.

## Tech
Next.js (React), Tailwind CSS, Supabase (Postgres and Auth), Vercel,
GitHub Actions.

## Known limits (what I would build next)
- Clients cannot yet request a cancellation or reschedule themselves.
- Clients cannot choose a stylist, because the salon is booked by chair time.
- WhatsApp messages are sent by staff with one tap. There are no automatic
  reminders, because that needs the paid WhatsApp Business service.
- Some styles do not have a photo yet.
- Prices, durations and deposits are the owner's figures, and some durations
  are estimates.
- Stock tracking, which the owner currently does by calling her supplier.

## Data
No real personal data is used. All names, emails, phone numbers and bookings
are test data. Hairstyle photos are cropped to show hair only.
