# Afiya - Medical Clinic Management System

A comprehensive medical clinic management system built with modern web technologies, designed to streamline healthcare operations for patients, doctors, and administrators.

## Overview

Afiya is a full-stack Progressive Web Application (PWA) that provides a complete solution for managing medical clinics. The system features role-based access control, real-time notifications, appointment scheduling, prescription management, medical history tracking, and integrated payment processing.

## Key Features

### For Patients

- **User Authentication**: Secure email/password registration and login with OTP verification
- **Appointment Booking**: Schedule appointments with available doctors based on their schedules
- **Medical History**: Access complete medical history and past appointments
- **Prescription Management**: View and download prescriptions and medication details
- **Payment Processing**: Multiple payment methods (Cash, Card, UPI, Online)
- **Real-time Notifications**: Instant updates via in-app, email, and push notifications
- **Offline Support**: PWA capabilities for offline access

### For Doctors

- **Schedule Management**: Set and manage availability slots
- **Patient Dashboard**: View upcoming appointments and patient information
- **Prescription Creation**: Create and manage prescriptions with medication details
- **Medical Records**: Access patient medical history and notes
- **Real-time Updates**: Instant notifications for new appointments

### For Administrators

- **User Management**: Manage patients, doctors, and admin accounts
- **System Overview**: Dashboard with key metrics and statistics
- **Appointment Oversight**: Monitor and manage all appointments
- **Payment Tracking**: Track and verify payments across the system
- **Notification Management**: System-wide notification controls

## Tech Stack

### Frontend

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Typography**: Mluvka (Custom professional medical UI font)
- **PWA**: Service Workers, Web App Manifest, Install Prompts

### Backend

- **Runtime**: [Node.js](https://nodejs.org/)
- **API**: Next.js API Routes (REST)
- **Authentication**: [Better-auth](https://better-auth.com/) (Session-based)
- **Validation**: [Zod](https://zod.dev/) schemas

### Database

- **Database**: [PostgreSQL](https://www.postgresql.org/) (Neon Serverless)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Migration**: Drizzle Kit

### Real-time & Notifications

- **WebSocket**: [Pusher Channels](https://pusher.com/channels)
- **Push Notifications**: [Pusher Beams](https://pusher.com/beams)
- **Email**: [Resend](https://resend.com/) (Transactional emails & OTP)

### File Storage

- **Cloud Storage**: [Cloudinary](https://cloudinary.com/)

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL**: Neon serverless account or local PostgreSQL instance
- **Pusher Account**: For real-time features
- **Cloudinary Account**: For file uploads
- **Resend Account**: For email notifications

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/afiya.git
   cd afiya
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host/database

   # Authentication
   BETTER_AUTH_SECRET=your-secret-key-min-32-chars
   BETTER_AUTH_URL=http://localhost:3000

   # Pusher (Real-time)
   NEXT_PUBLIC_PUSHER_APP_KEY=your-pusher-app-key
   PUSHER_APP_ID=your-pusher-app-id
   PUSHER_SECRET=your-pusher-secret
   NEXT_PUBLIC_PUSHER_CLUSTER=your-pusher-cluster

   # Pusher Beams (Push Notifications)
   NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID=your-beams-instance-id
   PUSHER_BEAMS_SECRET_KEY=your-beams-secret-key

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Resend (Email)
   RESEND_API_KEY=your-resend-api-key
   RESEND_FROM_EMAIL=noreply@yourdomain.com

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**

   ```bash
   # Generate migration files from schema
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # (Optional) Push schema directly for development
   npm run db:push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

```bash
# Development
npm run dev              # Start development server on http://localhost:3000

# Production
npm run build            # Create optimized production build
npm start                # Start production server

# Linting
npm run lint             # Run ESLint for code quality checks

# Database (Drizzle ORM)
npm run db:generate      # Generate migration files from schema changes
npm run db:migrate       # Run pending migrations against database
npm run db:push          # Push schema directly to database (dev only)
npm run db:studio        # Open Drizzle Studio UI for database inspection
```

## Project Structure

```text
afiya/
├── app/
│   ├── (auth)/              # Authentication pages (login, register, verify)
│   ├── (dashboard)/         # Protected dashboard with role-based views
│   │   ├── patient/         # Patient-specific pages
│   │   ├── doctor/          # Doctor-specific pages
│   │   └── admin/           # Admin-specific pages
│   ├── api/                 # REST API routes
│   │   ├── appointments/    # Appointment management endpoints
│   │   ├── auth/            # Authentication endpoints
│   │   ├── notifications/   # Notification endpoints
│   │   ├── prescriptions/   # Prescription endpoints
│   │   └── payments/        # Payment processing endpoints
│   ├── layout.tsx           # Root layout with font configuration
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # Reusable UI components (Radix-based)
│   └── ...                  # Feature-specific components
├── lib/
│   ├── db/
│   │   └── schema.ts        # Database schema (Drizzle)
│   ├── validations/         # Zod validation schemas
│   ├── auth.ts              # Better-auth server configuration
│   ├── auth-client.ts       # Client-side auth hook
│   └── utils.ts             # Utility functions
├── public/
│   ├── fonts/Mluvka/        # Custom Mluvka font files
│   ├── icons/               # PWA icons
│   └── manifest.json        # PWA manifest
├── scripts/                 # Database utilities and seed scripts
├── middleware.ts            # Route protection and session validation
└── tailwind.config.ts       # Tailwind CSS configuration
```

## Database Schema

### Core Tables

- **users**: User accounts with role-based access (PATIENT, DOCTOR, ADMIN)
- **sessions**: Authentication session management
- **patient_profiles**: Extended patient information and demographics
- **medical_history**: Patient medical records and history
- **appointments**: Appointment scheduling and management
- **prescriptions**: Prescription records
- **medications**: Medication details linked to prescriptions
- **doctorSchedule**: Doctor availability and time slots
- **payments**: Payment records and transaction tracking
- **notifications**: In-app notification storage

### Key Enums

- **roleEnum**: PATIENT, DOCTOR, ADMIN
- **appointmentStatusEnum**: SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED
- **paymentStatusEnum**: PENDING, PAID
- **paymentMethodEnum**: CASH, CARD, UPI_MANUAL, UPI_QR, ONLINE

## Authentication & Authorization

### Session Management

- **Authentication Library**: Better-auth with session-based authentication
- **Session Storage**: HTTP-only cookies (`better-auth.session_token`)
- **Session Duration**:
  - Patients: 1 hour
  - Doctors & Admins: 1 day with sliding expiration
- **Email Verification**: OTP-based email verification via Resend

### Route Protection

- Middleware (`middleware.ts`) validates sessions and enforces role-based access
- Protected API routes check session validity:

  ```typescript
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ```

### Authorization Flow

1. User registers with email/password
2. Email verification OTP sent via Resend
3. User verifies email with OTP
4. Session created with role-based duration
5. Middleware redirects based on user role
6. API routes validate session and role permissions

## Real-time Features

### Pusher Channels (WebSocket)

- Real-time appointment updates
- Live notification delivery
- Doctor schedule changes
- Custom hook: `usePusherNotifications`

### Pusher Beams (Push Notifications)

- Browser push notifications
- Appointment reminders
- Prescription notifications
- Cross-device notification sync

### Fallback Mechanism

- Database polling fallback if Pusher unavailable
- Graceful degradation for offline scenarios

## Progressive Web App (PWA)

- **Service Worker**: Offline support and caching strategies
- **Install Prompt**: Native app-like installation
- **Manifest**: Custom icons, theme colors, and app metadata
- **Offline Page**: Custom offline experience
- **Update Notifications**: Service worker update detection

## Appointment Booking

### Race Condition Protection

- Database-level checks prevent double-booking
- Transaction-based slot reservation
- Real-time availability updates

### Multi-channel Notifications

Appointment confirmations trigger:

1. **Email**: Via Resend
2. **In-app**: Via Pusher + Database
3. **Push**: Via Pusher Beams

## Typography

### Mluvka Font

- **Location**: `public/fonts/Mluvka/`
- **Weights**: Regular (400), Medium (500), Bold (700)
- **Usage**: Body text, buttons, headings
- **Format**: OpenType (.otf)
- **Rationale**: Professional typography for medical applications

## Development Workflow

1. **Feature Development**
   - Create feature branch from `main`
   - Implement feature with TypeScript and proper types
   - Add Zod validation for forms and API endpoints
   - Write appropriate error handling

2. **Database Changes**
   - Update `lib/db/schema.ts`
   - Run `npm run db:generate` to create migration
   - Review generated migration SQL
   - Run `npm run db:migrate` to apply changes

3. **Testing**
   - Test all user flows manually
   - Verify role-based access controls
   - Test real-time notifications
   - Check responsive design on multiple devices

4. **Code Quality**
   - Run `npm run lint` before committing
   - Follow existing code patterns and conventions
   - Use TypeScript for type safety
   - Add comments for complex business logic

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- AWS Amplify
- Netlify
- Railway
- DigitalOcean App Platform

**Requirements**:

- Node.js 18+ runtime
- PostgreSQL database (Neon recommended)
- Environment variables configured

## Security Considerations

- **Session Security**: HTTP-only cookies prevent XSS attacks
- **CSRF Protection**: Built into Better-auth
- **SQL Injection**: Prevented by Drizzle ORM parameterized queries
- **Input Validation**: Zod schemas validate all inputs
- **Rate Limiting**: Consider implementing for production
- **Environment Variables**: Never commit `.env` to version control

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add JSDoc comments for complex functions
- Follow existing naming conventions
- Keep components small and focused

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Better-auth](https://better-auth.com/) - Modern authentication library
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Pusher](https://pusher.com/) - Real-time messaging infrastructure
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
- [Neon](https://neon.tech/) - Serverless PostgreSQL

## Support

For support, email [support@afiya.com](mailto:support@afiya.com) or open an issue in the GitHub repository.

## Roadmap

- [ ] Video consultation integration
- [ ] Lab test result management
- [ ] Insurance claim processing
- [ ] Multi-language support
- [ ] Mobile apps (iOS/Android)
- [ ] AI-powered symptom checker
- [ ] Telemedicine features
- [ ] Pharmacy integration

---

Made with ❤️ for better healthcare management
