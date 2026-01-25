# IN1Bet - Casino & Sports Betting Platform

## Overview

IN1Bet is a Brazilian online casino and sports betting platform designed for real money operations. The platform features PIX payments via OndaPay, CPF validation for Brazilian users, LGPD compliance, and a comprehensive suite of casino games including both in-house provably fair games and external provider integrations via PlayFivers API.

The system is built as a full-stack TypeScript application with a React frontend and Express.js backend, using PostgreSQL (Neon Cloud) for data persistence. Key features include a transaction ledger for financial integrity, bonus system with rollover requirements, KYC verification, affiliate program with anti-fraud detection, and a real-time support chat system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, Zustand for global chat WebSocket state
- **UI Components**: shadcn/ui with Radix UI primitives (New York style)
- **Styling**: Tailwind CSS v4 with custom dark theme using CSS variables
- **Build Tool**: Vite with custom plugins for meta images and Replit integration
- **Real-time**: WebSocket connection managed via Zustand store for persistent chat across navigation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Authentication**: JWT-based with access tokens (15min expiry) and refresh tokens (7 days, stored in database)
- **Password Security**: bcrypt for hashing
- **Session Tracking**: Real device info captured (browser, OS, IP address) in refresh_tokens table
- **API Structure**: RESTful endpoints organized by module under `/server/modules/`
- **Real-time**: WebSocket (ws) for live chat and game updates
- **Rate Limiting**: express-rate-limit with trust proxy configuration
- **Email**: Nodemailer for password recovery and notifications

### Data Storage
- **Database**: PostgreSQL hosted on Neon Cloud
- **ORM**: Drizzle ORM with drizzle-kit for schema migrations
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Key Tables**: users, wallets, refreshTokens, pixDeposits, pixWithdrawals, transactions, bets, minesGames, bonuses, user_bonuses, affiliates, kyc_verifications, support_chats, support_tickets, support_departments

### Core Business Modules
- **Auth**: Login, register, refresh tokens, CPF validation, password recovery with email tokens
- **Wallet**: Available and locked balances with atomic transaction ledger (SELECT FOR UPDATE)
- **Payments**: PIX deposits via OndaPay with webhook-only crediting (no pre-crediting)
- **Withdrawals**: Manual approval flow with KYC requirements and rollover checks, optional auto-withdrawal with limits
- **Bonus System**: Multiple bonus types (welcome, reload, no-deposit) with rollover requirements
- **KYC**: Internal verification system with security department workflow
- **Affiliate System**: CPA, Revenue Share, and Hybrid commission models with anti-fraud detection
- **Games**: Provably fair in-house games (Mines, Crash, Double, Plinko) using HMAC-SHA256
- **External Games**: PlayFivers API integration for slots and live casino
- **Admin Panel**: User management, financial controls, security audit logs, role-based access (ADMIN/SECURITY)
- **Support**: Live chat via WebSocket, ticket system with department routing and SLA

### Build & Deployment
- **Build Script**: Custom `script/build.ts` using tsx
- **Production Output**: `dist/index.cjs` for CommonJS compatibility
- **Process Manager**: PM2 for production (ecosystem.config.js provided)
- **Reverse Proxy**: Nginx configuration for WebSocket support documented in `nginx-websocket-config.md`
- **Database Migrations**: Run `npx drizzle-kit push` to sync schema

## External Dependencies

### Payment Processing
- **OndaPay**: PIX payment gateway for deposits and withdrawals
  - Environment variables: `ONDAPAY_CLIENT_ID`, `ONDAPAY_CLIENT_SECRET`, `ONDAPAY_WEBHOOK_URL`, `ONDAPAY_WEBHOOK_SECRET`
  - Webhook-based crediting for security

### External Game Provider
- **PlayFivers**: Third-party casino games API (slots, live casino)
  - Environment variables: `PLAYFIVERS_AGENT_TOKEN`, `PLAYFIVERS_SECRET_KEY`, `PLAYFIVERS_AGENT_CODE`, `PLAYFIVERS_AGENT_SECRET`

### Database
- **Neon Cloud**: Serverless PostgreSQL
  - Environment variable: `DATABASE_URL` (connection string with SSL)

### Email Service
- **Nodemailer**: SMTP-based email for password recovery
  - Environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_NAME`, `APP_URL`
  - Falls back to logging tokens in development if SMTP not configured

### Push Notifications (Optional)
- **Web Push**: VAPID-based notifications
  - Environment variables: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

### Core Environment Variables
- `NODE_ENV`: production/development
- `PORT`: Server port (default 5000)
- `JWT_SECRET`: Secret for JWT signing (64+ characters recommended)
- `SESSION_SECRET`: Session encryption key