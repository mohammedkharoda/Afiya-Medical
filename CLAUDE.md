# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Afiya is a medical clinic management system built with Next.js 16, TypeScript, and PostgreSQL (Neon serverless). It provides role-based features for patients, doctors, and admins including appointment scheduling, prescription management, medical history tracking, and payment processing.

## Command

```bash
# Development
npm run dev              # Start development server

# Production
npm run build            # Production build
npm start                # Start production server

# Linting
npm run lint             # Run ESLint

# Database (Drizzle ORM)
npm run db:generate      # Generate migration files from schema changes
npm run db:migrate       # Run pending migrations
npm run db:push          # Push schema directly to database (dev only)
npm run db:studio        # Open Drizzle Studio UI for database inspection
```

## Architecture

### Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Auth**: better-auth (session-based with email/password)
- **UI**: Tailwind CSS + Radix UI components
- **Real-time**: Pusher (WebSocket) + Pusher Beams (push notifications)
- **Email**: Resend (transactional emails & OTP)
- **File Storage**: Cloudinary
- **Validation**: Zod schemas
- **Typography**: Mluvka (professional font for medical UI)

### Typography & Fonts

**Mluvka Font**:

- **Location**: `public/fonts/Mluvka/`
- **Weights Used**:
  - Regular (400) - Body text and general UI
  - Medium (500) - Buttons and emphasized text
  - Bold (700) - Headings (h1-h4)
- **Configuration**: Loaded via `next/font/local` in [app/layout.tsx](app/layout.tsx)
- **CSS Variable**: `--font-mluvka`
- **Tailwind**: Configured as default `sans` font family in [tailwind.config.ts](tailwind.config.ts)
- **Format**: OpenType (.otf)

**Font Files**:

```
Mluvka-Regular-BF65518ac8463f5.otf (400)
Mluvka-Medium-BF65518ac864edb.otf (500)
Mluvka-Bold-BF65518ac8cff8c.otf (700)
```

**Rationale**: Mluvka provides a clean, professional typography suitable for medical applications, enhancing readability and brand perception.

### Directory Structure

- `app/(auth)/` - Authentication pages (login, register, verify-email, verify-otp)
- `app/(dashboard)/` - Protected dashboard with role-based views
- `app/api/` - REST API routes with session-based auth
- `lib/db/schema.ts` - All database tables and relations (Drizzle)
- `lib/validations/` - Zod schemas for forms and API validation
- `lib/auth.ts` - Better-auth server configuration
- `lib/auth-client.ts` - Client-side auth hook (`useSession`)
- `components/ui/` - Reusable UI components (Radix-based)
- `scripts/` - Database utilities (seeding, migrations, debugging)

### Database Schema

Core tables: `users`, `sessions`, `patient_profiles`, `medical_history`, `appointments`, `prescriptions`, `medications`, `doctorSchedule`, `payments`, `notifications`

Key enums defined in schema:

- `roleEnum`: PATIENT, DOCTOR, ADMIN
- `appointmentStatusEnum`: SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED
- `paymentStatusEnum`: PENDING, PAID
- `paymentMethodEnum`: CASH, CARD, UPI_MANUAL, UPI_QR, ONLINE

### Authentication Flow

1. Session tokens stored in `better-auth.session_token` cookie
2. Middleware (`middleware.ts`) protects routes and redirects unauthenticated users
3. Role-based session duration: Patients get 1 hour, Doctors/Admins get 1 day with sliding expiration
4. API routes must validate session via `auth.api.getSession()`

### Key Patterns

**API Route Protection**: All protected API routes check session and role:

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session)
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

**Real-time Notifications**: Pusher channels for instant updates:

- `usePusherNotifications` hook for listening to notification events
- Server triggers events on appointment/prescription changes
- Fallback to database polling if Pusher unavailable

**Appointment Booking**: Race condition protection via database checks at booking time to prevent double-booking slots.

**Multi-channel Notifications**: Appointments trigger email (Resend), in-app (Pusher + DB), and browser push notifications (Pusher Beams).

### Environment Variables

Required in `.env`:

- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret key
- `PUSHER_*` - Pusher app credentials
- `CLOUDINARY_*` - Cloudinary credentials
- `RESEND_API_KEY` - Resend email service API key
- `RESEND_FROM_EMAIL` - Sender email address
