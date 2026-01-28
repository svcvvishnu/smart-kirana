# Smart Kirana - Development Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- Git

## Quick Start

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment

Copy the example environment file and update with your database credentials:

```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL database URL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/smart_kirana"
NEXTAUTH_SECRET="generate-a-random-secret-key"
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with test data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and you'll be redirected to the login page.

## Test Credentials

After running the seed script, use these credentials to test different user roles:

### Owner Account (Full Access)
- Email: `owner@test.com`
- Password: `password123`

### Operations Account (Billing Only)
- Email: `cashier@test.com`
- Password: `password123`

### Admin Account (Platform Management)
- Email: `admin@smartkirana.com`
- Password: `admin123`

## Features Implemented

### ✅ Core Infrastructure
- Next.js 15 with App Router
- TypeScript with strict mode
- Prisma ORM with PostgreSQL
- NextAuth v5 for authentication
- TailwindCSS + shadcn/ui components
- PWA support for mobile installation

### ✅ Authentication & Authorization
- Role-based access control (4 roles: Owner, Operations, Support, Admin)
- JWT-based session management
- Protected routes with middleware
- Session persistence

### ✅ Database Schema
- 12 comprehensive models
- User management with multi-role support
- Product & Category management
- Stock tracking with transaction history
- Sales & Billing with profit calculation
- Customer management
- Subscription-based feature gating
- Notifications system

###  ✅ User Interfaces
- Beautiful gradient login page
- Role-based dashboard with statistics
- Mobile-first responsive design
- Modern premium UI components

### 🚧 In Progress
- Full inventory management UI
- Comprehensive billing interface
- Customer insights & analytics
- Report generation & exports

## Project Structure

```
smart-kirana/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility functions
│   ├── db.ts              # Prisma client
│   ├── utils.ts           # Helper functions
│   ├── calculations.ts    # Business logic
│   └── permissions.ts     # Access control
├── prisma/                # Database
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── public/                # Static assets
├── auth.ts                # NextAuth configuration
├── middleware.ts          # Route protection
└── types/                 # TypeScript types
```

## Database Management

### View Database in Browser
```bash
npm run db:studio
```

### Reset Database
```bash
npm run db:push -- --force-reset
npm run db:seed
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio

## Deployment

### Database Setup

1. Create a PostgreSQL database (recommended providers: Neon, Supabase, Railway)
2. Update `DATABASE_URL` in your production environment variables
3. Run migrations:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your production URL completed)
   - `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
4. Deploy!

## Technology Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: TailwindCSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **Mobile**: PWA (Progressive Web App)

## Troubleshooting

### Dependency Conflicts
If you encounter peer dependency issues:
```bash
npm install --legacy-peer-deps
```

### Database Connection Issues
- Verify your DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check firewall/network settings for cloud databases

### Build Errors
- Run `npm run db:generate` to regenerate Prisma client
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install --legacy-peer-deps`

## Next Steps

To complete the full implementation:

1. **Product Management UI** - Create/edit products and categories
2. **Billing Interface** - Full point-of-sale system with cart
3. **Inventory Management** - Stock adjustments and history
4. **Analytics Dashboard** - Charts and insights (subscription-gated)
5. **Customer Management** - Purchase history and insights
6. **Report Generation** - PDF/Excel exports
7. **Invoice Sharing** - WhatsApp/Email integration
8. **Notifications** - Low stock alerts and daily summaries

## Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://authjs.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

---

Built with ❤️ for small business owners
