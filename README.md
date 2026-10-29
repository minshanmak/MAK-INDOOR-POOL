# M.A.K Indoor Pool Management System

Production-oriented digital booking and operations management platform for **M.A.K Indoor Pool**, Aluva, Kerala.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM** with relational SQLite for zero-friction local development and automated testing, seamlessly configurable for PostgreSQL in production.

---

## 1. System Overview

The system unifies two connected applications sharing an authoritative backend and relational database:

### A. Public Customer Website
- **Pages**: Home, Book Now, Pricing, Facility Gallery, About Us, Contact, Operational Policies, FAQ, and Self-Service Booking Status Lookup.
- **Bilingual Interface**: English and Malayalam (മലയാളം) toggle.
- **Guided Booking Experience**:
  1. Slot type selection (Daily Public Swimming vs. Exclusive Family Booking).
  2. Date & slot availability with live capacity tracking.
  3. Authoritative server-side price calculation.
  4. 15-minute temporary slot hold with automatic TTL expiration.
  5. Payment gateway integration (Simulated development adapter or live Razorpay/Stripe).
  6. Instant confirmed booking receipt with unique Booking ID (`MAK-YYYYMMDD-XXX`) and printable receipt.
- **Customer Self-Service**: Check booking status, download receipt, reschedule (up to 6h cutoff), and request cancellation (up to 12h cutoff). Enforces IDOR security via registered mobile verification.

### B. Private Management Dashboard
- **Role-Based Access Control**:
  - **Super Admin**: Platform-wide settings, owner accounts, platform permissions, audit logs.
  - **Pool Owner**: Full operational control, staff management, rates & capacity configuration, payment reconciliation, cancellation approvals, and **exclusive refund decisions**.
  - **Staff**: Day-to-day operations (bookings, payments, walk-ins, cleaning checklists, water tests, and complaints).
- **Core Modules**:
  1. **Operations Overview**: Today's bookings, collections (Cash/UPI/Gateway), monthly revenue, outstanding balances, live occupancy, pending cancellations, and water safety alerts.
  2. **Booking Management**: Calendar and list views, staff-created phone/WhatsApp bookings, counter balance collection, and filters.
  3. **Walk-in Counter**: Live pool occupancy counter, quick-entry workflow, full check-in/out duration tracking, and authorized charge overrides with mandatory audit reasons.
  4. **Cancellations & Refunds**: Approval workflow to safely release locked slots, Owner-only refund decisions.
  5. **End-of-Day Closing**: Daily cash and UPI reconciliation against system expectations, variance calculation, and mandatory discrepancy notes.
  6. **Maintenance & Water Safety**: Twice-daily chlorine (ppm) and pH logs, shift cleaning checklists (morning/evening), and maintenance defect tracker.
  7. **Reports & Exports**: Date-range operational summaries and instant CSV exports.
  8. **Complaints & Feedback**: Ticketing system with resolution history and review moderation.
  9. **Staff & Permissions**: Individual staff accounts, role assignment, and granular permission matrices.
  10. **System Settings**: Owner-configured hourly rates, capacity limits, operating hours, and emergency maintenance mode.
  11. **Offline Mode**: Local queueing for walk-in entries during internet outages with conflict detection and synchronization.

---

## 2. Mandatory Business Rules & Pricing

### Operating Hours & Rules
- **Overall Hours**: 9:00 AM – 11:00 PM Daily.
- **Public Swimming**: 9:00 AM – 4:00 PM (Shared pool, max 25 swimmers concurrent capacity).
- **Exclusive Family Booking**: 4:00 PM – 11:00 PM (100% private pool access).

### Pricing Calculations
- **Public Swimming**: ₹150 / person / hour. Requires full payment for online reservations.
- **Family Booking**:
  - ₹1,500 / hour for up to 12 guests.
  - Each person above 12 adds ₹100 / hour for the entire duration.
  - Example (3 hours, 14 guests):
    - Base: 3 × ₹1,500 = ₹4,500
    - Extra (2 guests): 2 × ₹100 × 3 = ₹600
    - Total: ₹5,100
    - Online Advance: ₹750
    - Balance at Counter: ₹4,350

---

## 3. Demonstration Credentials

Pre-seeded demonstration accounts (all use password: `Password@123`):

| Role | Phone | Email | Default Password |
|---|---|---|---|
| **Pool Owner** | `+919999900002` | `owner@makpool.com` | `Password@123` |
| **Duty Staff** | `+919999900003` | `staff@makpool.com` | `Password@123` |
| **Super Admin** | `+919999900001` | `superadmin@makpool.com` | `Password@123` |

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+`

### Installation
```bash
# Install dependencies
npm install

# Push database schema to local SQLite
npx prisma db push

# Seed initial pool settings and demonstration staff accounts
node prisma/seed.js

# Run automated test suite
npm test

# Start development server
npm run dev
```

Visit the application:
- **Public Website**: [http://localhost:3000](http://localhost:3000)
- **Staff / Admin Login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 5. Automated Tests

The test suite validates pricing formulas, concurrency, temporary holds, permissions boundaries, and payment idempotency:

```bash
npm test
```

### Verified Test Cases:
- Public rate calculations (single, multiple people, fractional hours)
- Family booking pricing formula (<= 12 guests and > 12 guests with duration multiplier)
- Family ₹750 required advance and authoritative balance calculation
- Operating hours boundary enforcement (public bookings rejected after 16:00, family rejected before 16:00)
- Overlapping exclusive family booking prevention
- 15-minute temporary slot hold creation, active blocking, and automatic release on expiration
- Public swimming shared capacity limit warnings
- Staff permissions boundary (staff strictly prohibited from approving refunds)
- Idempotent payment verification (duplicate webhook callbacks ignored)
- Payment failure rejection without balance leakage

---

## 6. External Credentials & Integrations

The system includes safe abstractions and test adapters for development:

1. **Payment Gateway** (`src/lib/payments/payment-gateway.ts`):
   - Set `PAYMENT_GATEWAY_PROVIDER="RAZORPAY"` in `.env`.
   - Requires `PAYMENT_GATEWAY_KEY_ID` and `PAYMENT_GATEWAY_KEY_SECRET`.
   - Webhook signature verification implemented.
2. **Automated WhatsApp Messaging** (`src/lib/notifications.ts`):
   - Set `WHATSAPP_PROVIDER="META_CLOUD"` in `.env`.
   - Requires `WHATSAPP_API_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` with registered Meta WhatsApp Business templates.
3. **Database Migration to PostgreSQL (Production)**:
   - In `prisma/schema.prisma`, update `datasource db { provider = "postgresql" url = env("DATABASE_URL") }`.
   - Set `DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"` in `.env`.
   - Run `npx prisma migrate deploy`.
