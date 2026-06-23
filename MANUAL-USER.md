# User Manual, Sage Essence Booking Platform

A guide for the Sage Essence owner and team. It explains how the site works, how
a booking comes in, and how to use the admin panel to view and manage them. No
technical knowledge required.

Live site: **https://thesageessence.com**

---

## 1. What the platform is

This is the custom booking system for Sage Essence. It has two parts:

- **The public side** (what customers see): the branded home page and the booking
  form.
- **The admin panel** (just for you): where you see incoming bookings, customers,
  and leads.

Everything lives on the same domain:

| Address | What it is | Who uses it |
| --- | --- | --- |
| `thesageessence.com` | Home page (brand landing) | Public |
| `thesageessence.com/booking` | Booking form | Public |
| `thesageessence.com/login` | Panel sign in | You only |
| `thesageessence.com/admin` | Admin panel | You only |

---

## 2. The customer journey

Here is how a customer experiences it, start to finish:

1. **Lands on the home page** and sees the brand story: non-toxic cleaning for
   Austin, the benefits, reviews, before and after.
2. **Gets an instant estimate** in the estimate section: picks the type of clean,
   counts bedrooms and bathrooms, and the frequency. Sees a price range right
   away.
3. **Enters their details** (name, email, phone, zip code, sensitivities) and
   taps "Request this clean".
4. **Moves to the booking form** with everything prefilled. All that is left is
   to **pick a date and time**.
5. **Confirms and pays** (if payments are active, they go to a secure payment
   screen). When done, they see a confirmation page.
6. **Receives the automatic emails** as appropriate (see section 5).

Every completed booking shows up in the panel right away.

---

## 3. Signing in to the admin panel

1. Open **https://thesageessence.com/login**
2. Type the **admin password** (the one you set with the agency) and confirm.
3. You are in. The session stays signed in on that browser.
4. To leave, use **"Sign out"** at the top right.

Security tips:

- Do not share the password over chat or leave it written out in the open.
- If you sign in on someone else's computer, sign out when you are done.
- To change the password, ask the agency (it is a quick change).

---

## 4. Using the panel: the three sections

When you sign in, the panel shows three blocks, top to bottom.

### 4.1 Bookings

This is the list of all bookings, newest on top. For each one you see:

- **Type of clean and frequency** (for example "Deep clean, Weekly").
- **Date and time**, or "Date to confirm" if they have not picked one yet.
- **Bedrooms and bathrooms** (bd, ba).
- **Status** of the booking (see below).
- **Price**: the estimated range, or the amount paid once charged.
- **Extras** the customer requested, if any.

**Filter by status:** above the list there are buttons to show only bookings in a
given status: `all`, `pending`, `confirmed`, `completed`, `cancelled`. Tap one to
filter; `all` shows everything.

**What each status means:**

- **pending**: the booking came in but payment is not confirmed yet.
- **confirmed**: payment went through. The booking is scheduled.
- **completed**: the service has been done.
- **cancelled**: the booking was called off.

Statuses update on their own based on payment. If you need to change them by hand
from the panel, that option can be added, just ask the agency.

**Adding an extra charge to a booking:** inside each booking there is a field to
charge an add-on (for example "inside the fridge") with its amount in USD. This
lets you charge the customer for an extra service **using the card they already
provided**, without asking for it again. Type the description and amount, and
confirm. (Requires payments to be active. See section 5.)

### 4.2 Abandoned leads

This is gold for recovering sales. Here you see the people who **started** a
booking and **left their contact info**, but did not finish. For each one you see
name, email, phone, and which step they stopped at.

What to do with it: call or message them to help complete the booking. Often they
just needed a nudge.

### 4.3 Customers

- Shows the **total number of customers** and **how many opted in** to marketing.
- The **"Export CSV"** button downloads the full customer list as a file you can
  open in Excel or Google Sheets. Useful for email campaigns or backup.

---

## 5. What happens automatically

The platform works on its own in three areas. Depending on the activation stage,
these may all be on or turn on gradually.

### Payments (Stripe)
When payments are active, the customer goes to a secure payment screen when they
book. The money lands in the Sage Essence Stripe account. The panel's extra
charges also run through here.

### Calendar (Google Calendar)
Each confirmed booking can create an automatic event in the Sage Essence Google
calendar, so the team sees the schedule without copying anything by hand.

### Automatic emails (Resend)
The system sends branded emails on its own:

- **Prep:** as soon as a booking is made, what to expect and how to leave the
  space ready.
- **Reminder:** the day before the service.
- **Thank you:** after the service.

You do not have to do anything: they go out at the right moment.

---

## 6. Common tasks, step by step

**See today's or this week's bookings**
1. Go to `/login` and open the panel.
2. In "Bookings", check each booking's date. You can filter by `confirmed` to see
   only the ones already paid and scheduled.

**Recover a customer who did not finish**
1. Go to "Abandoned leads".
2. Take the phone or email and reach out to close the booking.

**Charge an extra on an existing booking**
1. In "Bookings", find the booking.
2. In its extra-charge field, type the description and the amount in USD, and
   confirm.

**Download the customer list**
1. In "Customers", tap "Export CSV".
2. Open the file in Excel or Google Sheets.

**Leave the panel**
1. Tap "Sign out" at the top right.

---

## 7. Frequently asked questions

**It will not let me sign in.**
Check the password. If you forgot it, the agency can reset it in minutes.

**A booking says "Demo mode" or "saved locally".**
It means the final database is not connected yet and the booking was saved
temporarily. Tell the agency to finish activating the database (Supabase).

**The customer did not get the email.**
Ask them to check spam or promotions. If it keeps happening, tell the agency to
review sending.

**I want to change a price, some text, or a photo on the site.**
The agency makes those changes. Send the details of what you want changed.

**The preview when sharing the link looks old.**
WhatsApp and social networks cache the image for a while. It refreshes on its own
within a few hours.

---

## 8. To show up on Google (important)

The site is already optimized for search engines, but two steps are on you (they
are free) and they are the ones that help the most to appear organically:

1. **Google Business Profile:** this is number one for local Austin searches. Add
   the name, phone, service area, photos, and the site `thesageessence.com`. Do
   it at business.google.com.
2. **Google Search Console:** verify the domain and submit the sitemap
   (`thesageessence.com/sitemap.xml`). It speeds up indexing. Do it at
   search.google.com/search-console.

If you like, the agency can walk you through both steps.

---

## 9. Support

For any question, issue, or change you want on the site, contact the agency with
the details. The clearer the request (which screen, what you were trying to do,
what happened), the faster it gets solved.

Sage Essence LLC, Austin TX.
