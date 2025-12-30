# IN1Bet - Casino & Sports Betting Platform

## Overview

IN1Bet is a Brazilian online casino and sports betting platform designed for real money operations, featuring PIX payments, CPF validation, and LGPD compliance. It targets the Brazilian market with casino games, live casino, sports betting, VIP programs, and responsible gaming tools. The platform uses a modular full-stack architecture with a React frontend, Express.js backend, and PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom dark theme
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Authentication**: JWT-based (access/refresh tokens)
- **Password Security**: bcrypt
- **API Structure**: RESTful endpoints
- **Modular Design**: Separate modules for `auth`, `users`, `wallet`, `payments`, `withdrawals`, `kyc`, `admin`, `betting`, `games`, `history`, `affiliate`, `playfivers`, and `support`.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema**: `shared/schema.ts` (shared between frontend/backend)
- **Key Tables**: `users`, `wallets`, `refreshTokens`, `pixDeposits`, `pixWithdrawals`, `transactions`, `bets`, `minesGames`, `bonuses`, `user_bonuses`, `welcome_bonus_claims`, `affiliates`, `affiliate_links`, `affiliate_conversions`, `affiliate_payouts`, `affiliate_clicks`, `playfivers_providers`, `playfivers_games`, `playfivers_sessions`, `playfivers_transactions`, `support_departments`, `admin_departments`, `support_chats`, `support_chat_messages`, `support_chat_transfers`, `support_tickets`, `support_ticket_messages`, `support_ticket_escalations`, `support_canned_responses`, `support_sla_rules`, `support_audit_logs`, `support_triage_rules`.

### Authentication
- User registration with CPF validation.
- JWT access (15min) and refresh (7 days) tokens.
- Refresh tokens stored in DB for revocation.

### Core Features
- **Wallet System**: Supports available and locked funds, detailed transaction ledger.
- **Withdrawal System**: PENDING → APPROVED → PAID flow, balance locking, KYC requirement, minimum withdrawal limits, and an automatic PIX withdrawal system with configurable limits and eligibility checks.
- **KYC Light**: CPF and name verification.
- **Bonus System**: Various bonus types (e.g., FIRST_DEPOSIT, NO_DEPOSIT) with rollover requirements, automatic application, and withdrawal restrictions until rollover completion.
- **Admin Panel**: Provides tools for user management, withdrawal approval/rejection, bonus template creation, and platform settings.
- **Betting System**: Instant game betting with atomic transactions and idempotency.
- **Provably Fair Gaming**: HMAC-SHA256 based with server, client seeds, and nonce for verifiable game outcomes (e.g., Mines game).
- **Affiliate System**: Referral tracking, CPA/REV_SHARE/HYBRID commission models, payout balance locking, maturation windows for conversions, and anti-fraud mechanisms (CPF/IP duplication checks).
- **Enterprise Support System**: Complete customer support solution with:
  - **Live Chat**: Real-time messaging with queue management, agent assignment, VIP priority, rating system with lifecycle tracking
  - **Ticketing**: Async support with ticket numbers, SLA tracking, escalation levels, internal notes for agents
  - **Departments**: Financeiro, Suporte Técnico, KYC/Verificação, Bônus e Promoções, Jogos, VIP
  - **Intelligent Triage**: Keyword-based auto-classification and routing to correct departments
  - **SLA Management**: Configurable response/resolution times, automatic breach detection
  - **Canned Responses**: Pre-defined response templates for agents
  - **Complete Audit Trail**: All actions logged for compliance
  - **Admin Dashboard**: 
    - Dedicated admin endpoints with enriched user/department data via JOINs
    - Ticket filtering (status, priority, department, SLA-breached)
    - Grouped "open" status support (OPEN, WAITING_USER, WAITING_INTERNAL)
    - Management actions: assign, reply, escalate, resolve with internal notes

### Security
- **Rate Limiting**: Applied to general API access, authentication, registration, PIX creation, withdrawals, and webhooks.
- **Webhook Security**: HMAC-SHA256 signature verification for OndaPay webhooks (required in production).
- **PlayFivers Webhook Security**: Agent credentials validation (agent_code/agent_secret), timestamp verification (5-minute tolerance), duplicate transaction prevention via idempotency keys.

## External Dependencies

### Database
- PostgreSQL (via `DATABASE_URL`).

### Third-Party Integrations
- **OndaPay PIX**: For real PIX payment deposits and webhooks.
- **PlayFivers API**: Gaming provider integration for slots and live casino games. Features:
  - Providers/games synchronization and caching
  - Game launch with session tracking
  - Webhook handlers for balance queries and transactions (Bet/WinBet)
  - Idempotent transaction processing with atomic DB operations
  - Timestamp validation for webhook security
  - Required secrets: `PLAYFIVERS_AGENT_TOKEN`, `PLAYFIVERS_SECRET_KEY`, `PLAYFIVERS_AGENT_CODE`, `PLAYFIVERS_AGENT_SECRET`
- **JivoChat**: Live chat widget (placeholder).

### Key NPM Packages
- **UI**: Radix UI components, Lucide icons, class-variance-authority.
- **Forms**: React Hook Form with Zod validation.
- **Backend**: Express, jsonwebtoken, bcrypt, drizzle-orm.
- **Build**: Vite, esbuild, TSX.