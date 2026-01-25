# IN1Bet - Casino & Sports Betting Platform

## Overview

IN1Bet is a Brazilian online casino and sports betting platform designed for real money operations. The platform features PIX payments via OndaPay, CPF validation, LGPD compliance, and targets the Brazilian market with casino games (Crash, Mines, Double, Plinko), sports betting, and a complete affiliate system. The project is at an operational MVP stage with production deployment on a VPS at 69.62.95.236.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 19 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui with Radix UI primitives (New York style)
- **Styling**: Tailwind CSS v4 with custom dark theme and CSS variables
- **Build Tool**: Vite with custom plugins for meta images and Replit integration

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Authentication**: JWT-based with access tokens (15min) and refresh tokens (7 days stored in DB)
- **Password Security**: bcrypt for hashing
- **API Structure**: RESTful endpoints organized by module
- **Real-time**: WebSocket for live chat and game updates
- **Rate Limiting**: express-rate-limit with trust proxy configuration

### Data Storage
- **Database**: PostgreSQL hosted on Neon Cloud
- **ORM**: Drizzle ORM with drizzle-kit for schema migrations
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Key Tables**: users, wallets, refreshTokens, pixDeposits, pixWithdrawals, transactions, bets, minesGames, bonuses, user_bonuses, affiliates, kyc_verifications, support_chats, support_tickets

### Core Modules
- **Auth**: Login, register, refresh tokens, CPF validation
- **Wallet**: Available and locked balances with transaction ledger
- **Payments**: PIX deposits via OndaPay with webhook-only crediting
- **Withdrawals**: Manual approval flow with KYC requirements and rollover checks
- **Bonus System**: Multiple bonus types with rollover requirements
- **KYC**: Internal verification system with security department
- **Affiliate System**: CPA, Revenue Share, and Hybrid commission models with anti-fraud detection
- **Games**: Provably fair games (Mines, Crash, Double, Plinko) using HMAC-SHA256
- **Admin Panel**: User management, financial controls, security audit logs
- **Support**: Live chat via WebSocket, ticket system, department routing

### Build & Deployment
- **Build Script**: Custom `script/build.ts` using tsx
- **Production Output**: `dist/index.cjs` for CommonJS compatibility
- **Process Manager**: PM2 for production with cluster mode support
- **Static Files**: Built to `dist/public`

## External Dependencies

### Payment Gateway
- **OndaPay**: PIX payment processing for deposits and withdrawals
- Environment variables: `ONDAPAY_CLIENT_ID`, `ONDAPAY_CLIENT_SECRET`, `ONDAPAY_WEBHOOK_SECRET`
- Webhook endpoint for payment confirmations

### External Games Provider
- **PlayFivers API**: Third-party casino games integration
- Environment variables: `PLAYFIVERS_AGENT_TOKEN`, `PLAYFIVERS_SECRET_KEY`, `PLAYFIVERS_AGENT_CODE`

### Database
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database
- Connection via `DATABASE_URL` environment variable with SSL required
- Pooled connections for production performance

### Push Notifications
- **Web Push**: VAPID-based push notifications
- Environment variables: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

### Email Service
- **Nodemailer**: SMTP-based email for password recovery
- Environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_NAME`, `APP_URL`
- Works without configuration (logs token to console for development)

### Infrastructure
- **VPS Deployment**: Hostinger VPS at 69.62.95.236
- **Domain**: in1bet.com.br (pending DNS configuration)
- **Reverse Proxy**: Nginx via CloudPanel
- **Process Manager**: PM2 with auto-restart and clustering