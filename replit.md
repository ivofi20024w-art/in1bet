# IN1Bet - Casino & Sports Betting Platform

## Overview

IN1Bet is a Brazilian online casino and sports betting platform built for real money operations with PIX payments, CPF validation, and LGPD compliance requirements. The application follows a modular full-stack architecture with a React frontend and Express.js backend, using PostgreSQL for data persistence.

The platform targets the Brazilian market with features including casino games, live casino, sports betting, VIP programs, and responsible gaming tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom dark theme
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based structure under `client/src/pages/` with shared components in `client/src/components/`. Layout components handle the consistent header, sidebar, and footer across pages.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Authentication**: JWT-based with access/refresh token pattern
- **Password Security**: bcrypt for hashing
- **API Structure**: RESTful endpoints under `/api` prefix

The backend uses a modular architecture with separate modules for:
- `auth` - Registration, login, token refresh, logout
- `users` - Profile management
- `wallet` - Balance operations with ledger transactions
- `payments` - OndaPay PIX integration for deposits
- `withdrawals` - PIX withdrawal requests with balance locking
- `kyc` - KYC Light verification (CPF/name confirmation)
- `admin` - User and withdrawal management (isAdmin flag required)

### Data Storage
- **Database**: PostgreSQL (required, no SQLite)
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema Location**: `shared/schema.ts` (shared between frontend/backend)

Key tables:
- `users` - User accounts with CPF, KYC status, VIP level, isAdmin flag
- `wallets` - User balances (available and locked funds)
- `refreshTokens` - JWT refresh token storage
- `pixDeposits` - PIX deposit records with OndaPay integration
- `pixWithdrawals` - PIX withdrawal requests with status tracking
- `transactions` - Ledger for all balance changes (deposits, withdrawals, bets, wins)

### Authentication Flow
1. User registers with name, email, CPF, password
2. CPF is validated using Brazilian algorithm
3. Password hashed with bcrypt (10 rounds)
4. Wallet auto-created on registration
5. JWT access token (15min) + refresh token (7 days) issued
6. Refresh tokens stored in database for revocation capability

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets` → `attached_assets/`

## External Dependencies

### Database
- PostgreSQL via `DATABASE_URL` environment variable
- Connection pooling with `pg` driver
- Drizzle ORM for type-safe queries

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (required in production)

### Key NPM Packages
- **UI**: Radix UI components, Lucide icons, class-variance-authority
- **Forms**: React Hook Form with Zod validation
- **Backend**: Express, jsonwebtoken, bcrypt, drizzle-orm
- **Build**: Vite, esbuild, TSX

### Third-Party Integrations
- **OndaPay PIX** - Real PIX payment integration for deposits
  - POST /api/payments/pix/create - Creates PIX charge, returns QR code + copia/cola
  - GET /api/payments/pix/status/:externalId - Check payment status
  - GET /api/payments/pix/history - User's PIX deposit history
  - POST /api/webhook/ondapay - Webhook for payment confirmation
  - Requires: ONDAPAY_CLIENT_ID, ONDAPAY_CLIENT_SECRET secrets

### Withdrawal System
- **Withdrawal Flow**: PENDING → APPROVED → PAID (or REJECTED with balance release)
- **Balance Locking**: When withdrawal requested, amount moves from available to locked balance
- **KYC Required**: Users must verify CPF/name before first withdrawal
- **Minimum**: R$ 20.00
- **Transaction Types**: WITHDRAW_RESERVE (lock balance), WITHDRAW_RELEASE (unlock if rejected)
- Endpoints:
  - POST /api/withdrawals/request - Request new withdrawal
  - GET /api/withdrawals/history - User's withdrawal history
  - GET /api/withdrawals/status/:id - Check withdrawal status

### KYC Light Verification
- POST /api/kyc/submit - Submit CPF and full name for verification
- GET /api/kyc/status - Check KYC verification status
- Validates CPF matches user's registration data

### Bonus System
- **Bonus Types**: FIRST_DEPOSIT, RELOAD, CASHBACK, FREE_BET, VIP, NO_DEPOSIT
- **Rollover Control**: Users must bet (bonusAmount × rolloverMultiplier) to convert bonus to real balance
- **Tables**:
  - `bonuses` - Bonus templates created by admin (includes fixedAmount and maxWithdrawal fields)
  - `user_bonuses` - User bonus instances with status tracking
  - `welcome_bonus_claims` - CPF tracking for no-deposit bonus anti-fraud
- **Wallet Fields**: bonusBalance, rolloverRemaining, rolloverTotal
- **Transaction Types**: BONUS_CREDIT, BONUS_CONVERT, ROLLOVER_CONSUME
- **Rules**:
  - Only one active bonus per user at a time (prevents stacking)
  - Automatic bonus application on deposits based on eligibility
  - Withdrawals blocked until rolloverRemaining = 0
  - Bonus auto-converts to real balance when rollover complete
  - Max withdrawal limit enforced on conversion (excess is discarded)
- **Welcome Bonus (No-Deposit)**:
  - R$5 grátis ao se cadastrar
  - Rollover: 20x (R$100 de apostas necessárias)
  - Limite máximo de saque: R$50
  - Apenas 1 vez por CPF (anti-fraude)
  - Aplicado automaticamente no registro
- Endpoints:
  - GET /api/bonus/available - List active bonuses
  - GET /api/bonus/my-bonuses - User's active bonuses
  - GET /api/bonus/history - User's bonus history
  - GET /api/bonus/wallet-info - Bonus balance and rollover info
  - GET /api/bonus/withdrawal-check - Check if user can withdraw

### Admin Panel (/admin)
- Only accessible by users with isAdmin flag set to true in database
- **Withdrawal Endpoints**:
  - GET /api/admin/stats - Platform statistics
  - GET /api/admin/users - List all users
  - GET /api/admin/withdrawals - List withdrawals (filterable by status)
  - POST /api/admin/withdrawals/:id/approve - Approve pending withdrawal
  - POST /api/admin/withdrawals/:id/reject - Reject withdrawal (releases locked balance)
  - POST /api/admin/withdrawals/:id/pay - Mark approved withdrawal as paid
- **Bonus Management Endpoints**:
  - GET /api/admin/bonuses - List all bonus templates
  - POST /api/admin/bonuses - Create new bonus template
  - PUT /api/admin/bonuses/:id - Update bonus template
  - POST /api/admin/bonuses/:id/toggle - Toggle bonus active status
  - GET /api/admin/user-bonuses - List user bonus instances
  - POST /api/admin/user-bonuses/:id/cancel - Cancel user bonus
- **Settings Endpoints**:
  - GET /api/admin/settings - Get all platform settings
  - POST /api/admin/settings/pix-auto-withdraw - Toggle global auto-withdraw
  - PUT /api/admin/users/:id/auto-withdraw - Toggle user auto-withdraw permission

### Automatic PIX Withdrawal System
- **Global Toggle**: PIX_AUTO_WITHDRAW_GLOBAL setting in `settings` table
- **User Permission**: `autoWithdrawAllowed` flag in `users` table (defaults to true)
- **Eligibility Requirements**:
  - Global auto-withdraw must be enabled
  - User must have autoWithdrawAllowed = true
  - User must have KYC verified (kycStatus = "VERIFIED")
  - User must have completed rollover (rolloverRemaining = 0)
- **Auto-Payment Flow**:
  - When eligible withdrawal is requested, it's immediately approved and paid
  - System uses "SYSTEM_AUTO" as adminId in audit logs
  - Transaction logged with WITHDRAW_RESERVE and status set to PAID

### Affiliate System
- **Tables**:
  - `affiliates` - Affiliate accounts linked to users
  - `affiliate_links` - Trackable referral links with unique codes
  - `affiliate_conversions` - Conversion records (CPA, RevShare, Hybrid)
  - `affiliate_payouts` - Payout requests and history
  - `affiliate_clicks` - Click tracking for analytics
- **Commission Types**:
  - CPA: Fixed value per qualified conversion
  - REV_SHARE: Percentage of net revenue
  - HYBRID: CPA + RevShare combination
- **Referral Tracking**:
  - Users can register with ?ref=CODE parameter
  - Registration captures IP address for fraud detection
  - Conversion created automatically on registration
- **Anti-Fraud System**:
  - Platform-wide CPF duplication check (across all affiliates)
  - Platform-wide IP duplication check (3+ conversions = suspicious)
  - Self-referral detection (affiliate CPF/email matches user)
  - Fraud flagged conversions use "SYSTEM_FRAUD_DETECTION" for audit
- **Affiliate Endpoints**:
  - GET /api/affiliate/track/:code - Redirect tracking link
  - GET /api/affiliate/dashboard - Affiliate stats
  - POST /api/affiliate/payouts/request - Request payout
  - GET /api/affiliate/admin - List all affiliates (admin)
  - POST /api/affiliate/admin - Create affiliate (admin)
  - POST /api/affiliate/admin/:id/toggle-status - Toggle affiliate status (admin)
  - POST /api/affiliate/admin/conversions/:id/fraud - Mark as fraud (admin)
  - POST /api/affiliate/admin/payouts/:id/approve - Approve payout (admin)

- JivoChat widget (placeholder in index.html)

### Security Features

#### Rate Limiting (server/middleware/rateLimit.ts)
- **General Limiter**: 100 requests per 15 minutes for all /api routes
- **Auth Limiter**: 10 login attempts per 15 minutes per IP
- **Registration Limiter**: 5 registrations per hour per IP
- **PIX Limiter**: 3 PIX creations per minute per user
- **Withdrawal Limiter**: 2 withdrawal requests per minute per user
- **Webhook Limiter**: 50 webhook requests per second

#### Webhook Security
- **Production Mode**: ONDAPAY_WEBHOOK_SECRET is required
- **Development Mode**: Unsigned webhooks accepted with warning log
- HMAC-SHA256 signature verification using `x-ondapay-signature` header
- Timing-safe comparison to prevent timing attacks

#### Required Environment Variables for Production
- `NODE_ENV=production` - Enables strict security checks
- `ONDAPAY_WEBHOOK_SECRET` - Required for webhook signature verification
- `JWT_SECRET` - Required for JWT signing

### Development Tools
- Replit-specific Vite plugins for development banner and cartographer
- Custom meta images plugin for OpenGraph tags