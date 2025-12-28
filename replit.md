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
- `wallet` - Balance operations
- `payments` - PIX integration placeholder
- `admin` - Administrative functions placeholder

### Data Storage
- **Database**: PostgreSQL (required, no SQLite)
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema Location**: `shared/schema.ts` (shared between frontend/backend)

Key tables:
- `users` - User accounts with CPF, KYC status, VIP level
- `wallets` - User balances (available and locked funds)
- `refreshTokens` - JWT refresh token storage

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

### Third-Party Integrations (Planned)
- PIX payment gateway (placeholder in payments module)
- KYC verification service (placeholder)
- JivoChat widget (placeholder in index.html)

### Development Tools
- Replit-specific Vite plugins for development banner and cartographer
- Custom meta images plugin for OpenGraph tags