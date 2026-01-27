# IN1Bet - Casino & Sports Betting Platform

## Recent Changes (2026-01-27)

### User Avatar System & Chat Restrictions
- **Profile Avatar Selection**
  - 50 pre-generated gaming/casino-themed avatars (35 male, 15 female)
  - Avatar selection modal with gender filters (All/Male/Female)
  - Visual feedback on selected avatar with checkmark overlay
  - Avatars stored in `/client/public/avatars/male/` and `/client/public/avatars/female/`
  - Backend validates only `/avatars/*` URLs are accepted (no custom uploads)
  - Location: `client/src/pages/profile/Profile.tsx`, `server/modules/users/users.routes.ts`

- **Chat Level Restrictions**
  - GIF and photo upload buttons in community chat are locked for users below level 50
  - Locked buttons show padlock icon with yellow indicator
  - Popover explains the level requirement when clicked
  - Users level 50+ see unlocked buttons with full functionality
  - Location: `client/src/components/chat/CommunityChat.tsx`

### Security Audit & Fixes
- **CRITICAL FIX: OndaPay Webhook Signature Verification**
  - Fixed bypass vulnerability where `verifyWebhookSignature()` always returned `{valid: true}`
  - Now enforces HMAC-SHA256 signature validation with timing-safe comparison
  - Rejects webhooks when `ONDAPAY_WEBHOOK_SECRET` is not configured
  - Uses raw body for accurate signature calculation
  - Location: `server/modules/payments/ondapay/ondapay.routes.ts`

- **Admin Panel: OndaPay Key Management**
  - Added UI section in Admin Settings for managing OndaPay credentials
  - Secure credential update without exposing previous values
  - Connection test functionality
  - Full audit logging of changes
  - New endpoints: `/api/admin/settings/ondapay`, `/api/admin/settings/ondapay-status`, `/api/admin/settings/ondapay/test`

- **Security Audit Documentation**
  - Created comprehensive `SECURITY_AUDIT_REPORT.md` with:
    - All vulnerabilities identified by severity
    - Prioritized fix recommendations
    - Status of corrections

## Recent Changes (2026-01-23)
- **Real Device Tracking**: Sessions now show actual device info (browser, OS, IP)
  - Extended refresh_tokens table with userAgent, ipAddress, deviceName, lastUsedAt
  - Device name parsed from User-Agent (e.g., "Chrome / Windows")
  - IP address captured from x-forwarded-for or req.ip
  - Added endpoints: GET /api/auth/sessions, DELETE /api/auth/sessions/:id, DELETE /api/auth/sessions
  - Security.tsx updated to fetch and display real session data with revoke functionality

- **Password Recovery System**: Complete password reset flow with email support
  - Email service using Nodemailer (`server/modules/email/email.service.ts`)
  - Integrated forgot password modal in AuthModal with "Esqueceu a senha?" button
  - Secure token generation (HMAC-SHA256 hashed, 30-minute expiry)
  - Styled HTML email template with IN1Bet branding
  - Works with or without SMTP configuration (logs token in development)
  - Reset password page at `/reset-password?token=...`
  - Environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_NAME`, `APP_URL`

- **Global Chat WebSocket Store (Zustand)**: Complete refactor for performance and persistence
  - Created `chatStore.ts` with centralized WebSocket management using Zustand
  - WebSocket connection now persists across page navigations (no reconnects on every page)
  - Messages preserved between navigations using per-room Maps
  - Separated `disconnect()` (connection only) from `logout()` (full state reset)
  - Added robust connection lock (connectLock) with cleanup in all error scenarios
  - Per-room online counts via `getRoomOnlineCount()` and `roomOnlineCounts` Map
  - Message handlers now use server's roomId to avoid dropping messages from other rooms
  - `useAuth.ts` integrates with chatStore: auto-connect on login, full cleanup on logout
  - ChatWidget and CommunityChat refactored to consume the global store
  - Token refresh handled in auth_failed handler with proper lock cleanup

- **Community Chat WebSocket Stability** (Earlier): Fixed input oscillation (enable/disable loop) issue
  - Refactored to use refs for token instead of state to prevent connection callback recreation
  - Added race condition prevention with isConnectingRef lock BEFORE async operations
  - Implemented try/finally pattern with wsCreated flag for reliable lock cleanup
  - Added 15-second failsafe timeout to reset connection lock if socket never opens
  - Backend now sends auth_failed instead of closing connection, allowing 10s for re-auth
  - Frontend handles auth_failed by refreshing token and re-authenticating
  - Fixed storage event listener cleanup with named function
  - Added Nginx WebSocket configuration documentation (nginx-websocket-config.md)

## Recent Changes (2026-01-22)
- **Auth System Overhaul**: Fixed critical authentication bugs across the platform
  - queryClient.ts now sends auth tokens and auto-refreshes on 401 errors
  - Removed circular dependency in authTokens.ts by using fetch directly
  - Added reactive auth state with AUTH_CHANGE_EVENT system
  - dispatchAuthChange() fired on all auth mutations (login, register, logout, token refresh)
- **2FA System**: Fixed token retrieval using getStoredAuthState() instead of direct localStorage
- **Support Chat**: Fixed "Iniciar Chat" button using reactive useAuth() hook
- **Community Chat**: Added animated gradient role badges for ADMIN/SUPORTE/INFLUENCER and reply functionality

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
- **Modular Design**: Separate modules for `auth`, `users`, `wallet`, `payments`, `withdrawals`, `kyc`, `admin`, `betting`, `games`, `history`, `affiliate`, `slotsgateway`, `support`, `levels`, `rakeback`, `notifications`, and `missions`.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema**: `shared/schema.ts` (shared between frontend/backend)
- **Key Tables**: `users`, `wallets`, `refreshTokens`, `pixDeposits`, `pixWithdrawals`, `transactions`, `bets`, `minesGames`, `bonuses`, `user_bonuses`, `welcome_bonus_claims`, `affiliates`, `affiliate_links`, `affiliate_conversions`, `affiliate_payouts`, `affiliate_clicks`, `slotsgateway_providers`, `slotsgateway_games`, `slotsgateway_sessions`, `slotsgateway_transactions`, `support_departments`, `admin_departments`, `support_chats`, `support_chat_messages`, `support_chat_transfers`, `support_tickets`, `support_ticket_messages`, `support_ticket_escalations`, `support_canned_responses`, `support_sla_rules`, `support_audit_logs`, `support_triage_rules`, `level_history`, `daily_box_claims`, `rakeback_settings`, `rakeback_periods`, `rakeback_payouts`, `notifications`, `user_notifications`, `notification_preferences`, `push_subscriptions`, `mission_templates`, `mission_instances`, `mission_assignments`, `mission_progress_logs`.

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
- **Affiliate System**: Complete referral and commission system featuring:
  - CPA, Revenue Share, and Hybrid commission models
  - User-facing dashboard with real-time statistics (earnings, referrals, clicks, balance)
  - Self-registration for users to become affiliates
  - Custom affiliate link creation with campaign tracking
  - Withdrawal requests via PIX with balance locking
  - Conversion history with status tracking (Pending, Qualified, Fraud)
  - Payout history with status management
  - Anti-fraud mechanisms (CPF/IP duplication, auto-referral detection)
  - Maturation windows for conversions (configurable via settings)
  - Admin panel with user autocomplete for creating affiliates
  - CPF masking in admin endpoints for PII protection
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
- **Rakeback System**: Weekly cashback on losses with VIP-tier based percentages:
  - Bronze: 5%, Silver: 7.5%, Gold: 10%, Platinum: 12.5%, Diamond: 15%
  - Minimum loss threshold for eligibility
  - Rollover requirements (2-3x) before withdrawal
  - Admin controls for calculation and stats
- **Notifications System**: Real-time user notification system:
  - In-app notification inbox with read/unread status
  - Push notification support with Web Push subscriptions
  - User preference controls per category (promotions, bets, levels, missions, security)
  - Bell icon with unread badge counter in header
  - Admin broadcast notifications
- **Missions System**: Daily/weekly challenge system:
  - Template-based mission creation (BET_COUNT, BET_AMOUNT, WIN_COUNT, etc.)
  - VIP-adjusted rewards (XP or bonus cash)
  - Automatic daily/weekly instance creation
  - Progress tracking with hooks into betting system
  - Mission dashboard with tabs for daily/weekly missions
  - **Admin Panel** at `/admin/missions` with 3 tabs:
    - Templates: Create, edit, toggle, delete mission templates
    - User Missions: Search users by email/name, view progress, force-complete missions
    - Statistics: Completion metrics, popular missions, reward distribution
- **Promotional Codes System**: Complete promo code management:
  - **Code Types**: BONUS_FIXED, BONUS_PERCENT, FREE_BET, CASHBACK
  - **Configurable Limits**: Max uses, max uses per user, min deposit, date ranges
  - **Rollover Requirements**: Customizable multiplier per code
  - **User Interface**: Apply codes via Settings page with instant validation
  - **Admin Panel** at `/admin/promo-codes`:
    - Create/edit promo codes with all parameters
    - View usage statistics and recent uses
    - Toggle active/inactive status
    - Search by code/description
    - Filter by status and type
- **Community Chat System**: Real-time chat with advanced moderation:
  - Multiple chat rooms (Global, High Rollers, Casino) via tabbed interface
  - WebSocket-based real-time messaging with framer-motion animations
  - VIP badges and level indicators next to usernames
  - **Chat Moderator Roles**: HELPER, CHAT_MODERATOR, SUPPORT, ADMIN with visible badges
  - **Chat Customization** (Level 50+): Custom name colors, effects (glow, rainbow, bold, italic), message colors
  - **Emoji Picker**: iPhone-style picker with categories (Sorrisos, Gestos, Jogos, Celebração, Animais, Corações)
  - **Message Reactions**: Emoji reactions on messages (like, heart, fire, etc.)
  - **Reply System**: Drag-to-reply gesture for quoting messages
  - **User Profile Modal**: Click username to see stats (wins, games played, ranking, favorite game)
  - **Privacy Controls**: User stats hide sensitive data (totalWagered, win amounts) from non-owners/non-admins
  - **Admin Rain System**: `/rain [amount]` command to distribute real prizes:
    - Validates amount (R$10-R$10,000)
    - Credits wallets via atomic database transactions
    - Creates BONUS transaction records
    - Sends individual rain_received notifications to recipients
    - Excludes admin from recipients
  - **Typing Indicators**: Real-time "user is typing..." display with auto-timeout
  - **Online Count Per Room**: Live user count displayed for each chat room
  - **User Blocking**: Users can block other users to hide their messages
  - Automatic moderation filters:
    - Link/URL blocking (domains, IPs, shortened URLs)
    - Phone/WhatsApp number detection
    - Scam phrase detection (Portuguese patterns)
    - Profanity filter with customizable word list
    - Anti-spam/flood protection (rate limiting)
  - Progressive penalty system: Warning → 5min Mute → 1hr Mute → Ban
  - **Casino-wide bans**: Admin can ban users from entire platform (temporary or permanent)
  - User report system with admin review queue
  - Admin panel for chat management (reports, penalties, bad words, moderator roles)
  - Online user count and presence tracking

### Security
- **Rate Limiting**: Applied to general API access, authentication, registration, PIX creation, withdrawals, and webhooks.
- **Webhook Security**: HMAC-SHA256 signature verification for OndaPay webhooks (required in production).
- **SlotsGateway Callback Security**: API login/password validation, timestamp verification, duplicate transaction prevention via idempotency keys.

## External Dependencies

### Database
- PostgreSQL (via `DATABASE_URL`).

### Third-Party Integrations
- **OndaPay PIX**: For real PIX payment deposits and webhooks.
- **SlotsGateway API**: Gaming provider integration for slots and live casino games. Features:
  - Game list synchronization with 4500+ games available
  - Game launch with id_hash identification
  - Callback handlers for balance/bet/win transactions
  - Idempotent transaction processing with atomic DB operations
  - Player creation with pattern `in1bet_{userId}`
  - Currency: BRL (Brazilian Real), balance in cents
  - Required secrets: `SLOTSGATEWAY_API_LOGIN`, `SLOTSGATEWAY_API_PASSWORD`
  - Environment variable: `SLOTSGATEWAY_BASE_URL` (https://api-eu-1.slotsgateway.com/api/system/operator)
- **JivoChat**: Live chat widget (placeholder).

### Key NPM Packages
- **UI**: Radix UI components, Lucide icons, class-variance-authority.
- **Forms**: React Hook Form with Zod validation.
- **Backend**: Express, jsonwebtoken, bcrypt, drizzle-orm.
- **Build**: Vite, esbuild, TSX.