import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, boolean, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// CPF validation helper
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) return false;
  
  return true;
}

// Users table - Brazilian betting platform
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 30 }).notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  password: text("password").notNull(),
  phone: varchar("phone", { length: 20 }),
  birthDate: timestamp("birth_date"),
  isVerified: boolean("is_verified").default(false),
  isAdmin: boolean("is_admin").default(false),
  adminRole: varchar("admin_role", { length: 20 }).default("USER"),
  isBlocked: boolean("is_blocked").default(false),
  blockReason: text("block_reason"),
  blockedAt: timestamp("blocked_at"),
  blockedBy: varchar("blocked_by"),
  kycStatus: varchar("kyc_status", { length: 20 }).default("pending"),
  vipLevel: varchar("vip_level", { length: 20 }).default("bronze"),
  autoWithdrawAllowed: boolean("auto_withdraw_allowed").default(false),
  affiliateId: varchar("affiliate_id"),
  referralCode: varchar("referral_code", { length: 50 }),
  registrationIp: varchar("registration_ip", { length: 45 }),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  totalWagered: numeric("total_wagered", { precision: 15, scale: 2 }).default("0.00").notNull(),
  lastDailyBoxClaim: timestamp("last_daily_box_claim"),
  dailyDepositLimit: numeric("daily_deposit_limit", { precision: 15, scale: 2 }),
  weeklyDepositLimit: numeric("weekly_deposit_limit", { precision: 15, scale: 2 }),
  monthlyDepositLimit: numeric("monthly_deposit_limit", { precision: 15, scale: 2 }),
  maxBetLimit: numeric("max_bet_limit", { precision: 15, scale: 2 }),
  sessionTimeLimit: integer("session_time_limit"),
  selfExcludedUntil: timestamp("self_excluded_until"),
  permanentSelfExcluded: boolean("permanent_self_excluded").default(false),
  selfExclusionReason: text("self_exclusion_reason"),
  lastSessionStart: timestamp("last_session_start"),
  chatModeratorRole: varchar("chat_moderator_role", { length: 20 }).default("NONE"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorBackupCodes: text("two_factor_backup_codes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wallet table - auto-created on user registration
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  balance: numeric("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  bonusBalance: numeric("bonus_balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  lockedBalance: numeric("locked_balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  rolloverRemaining: numeric("rollover_remaining", { precision: 15, scale: 2 }).default("0.00").notNull(),
  rolloverTotal: numeric("rollover_total", { precision: 15, scale: 2 }).default("0.00").notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Refresh tokens for JWT (with device tracking)
export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  deviceName: text("device_name"),
  lastUsedAt: timestamp("last_used_at"),
});

// Password reset tokens - secure password recovery
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User settings - persistent user preferences
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  language: varchar("language", { length: 10 }).default("pt-BR").notNull(),
  oddsFormat: varchar("odds_format", { length: 20 }).default("decimal").notNull(),
  emailMarketing: boolean("email_marketing").default(false).notNull(),
  pushNotifications: boolean("push_notifications").default(true).notNull(),
  smsNotifications: boolean("sms_notifications").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PIX Deposits table - tracks PIX payment requests
export const pixDeposits = pgTable("pix_deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  externalId: varchar("external_id", { length: 128 }).notNull().unique(),
  ondapayTransactionId: varchar("ondapay_transaction_id", { length: 128 }),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  netAmount: numeric("net_amount", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  qrCode: text("qr_code"),
  qrCodeBase64: text("qr_code_base64"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transaction types for the ledger
export const TransactionType = {
  DEPOSIT: "DEPOSIT",
  WITHDRAW: "WITHDRAW",
  WITHDRAW_RESERVE: "WITHDRAW_RESERVE",
  WITHDRAW_RELEASE: "WITHDRAW_RELEASE",
  BET: "BET",
  WIN: "WIN",
  ROLLBACK: "ROLLBACK",
  BONUS: "BONUS",
  BONUS_CREDIT: "BONUS_CREDIT",
  BONUS_CONVERT: "BONUS_CONVERT",
  ROLLOVER_CONSUME: "ROLLOVER_CONSUME",
  RAKEBACK: "RAKEBACK",
  MISSION_REWARD: "MISSION_REWARD",
} as const;

// Bonus types
export const BonusType = {
  FIRST_DEPOSIT: "FIRST_DEPOSIT",
  RELOAD: "RELOAD",
  CASHBACK: "CASHBACK",
  FREE_BET: "FREE_BET",
  VIP: "VIP",
  NO_DEPOSIT: "NO_DEPOSIT",
} as const;

// Bonus status
export const BonusStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

// User bonus status
export const UserBonusStatus = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;

// Bonuses table - Available bonus templates
export const bonuses = pgTable("bonuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: varchar("type", { length: 30 }).notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  maxValue: numeric("max_value", { precision: 15, scale: 2 }).notNull(),
  fixedAmount: numeric("fixed_amount", { precision: 15, scale: 2 }).default("0.00").notNull(),
  maxWithdrawal: numeric("max_withdrawal", { precision: 15, scale: 2 }).default("0.00").notNull(),
  rolloverMultiplier: numeric("rollover_multiplier", { precision: 5, scale: 2 }).notNull(),
  minDeposit: numeric("min_deposit", { precision: 15, scale: 2 }).default("0.00").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isFirstDepositOnly: boolean("is_first_deposit_only").default(false).notNull(),
  validDays: numeric("valid_days", { precision: 5, scale: 0 }).default("30").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Welcome bonus CPF tracking - Anti-fraud for no-deposit bonuses
export const welcomeBonusClaims = pgTable("welcome_bonus_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  bonusId: varchar("bonus_id").notNull().references(() => bonuses.id),
  userBonusId: varchar("user_bonus_id").notNull().references(() => userBonuses.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User bonuses table - Tracks bonus applied to users
export const userBonuses = pgTable("user_bonuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bonusId: varchar("bonus_id").notNull().references(() => bonuses.id),
  depositId: varchar("deposit_id").references(() => pixDeposits.id),
  bonusAmount: numeric("bonus_amount", { precision: 15, scale: 2 }).notNull(),
  rolloverTotal: numeric("rollover_total", { precision: 15, scale: 2 }).notNull(),
  rolloverRemaining: numeric("rollover_remaining", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const TransactionStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

// Withdrawal status
export const WithdrawalStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PAID: "PAID",
} as const;

// KYC Status
export const KycStatus = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

// PIX Key Types
export const PixKeyType = {
  CPF: "CPF",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  RANDOM: "RANDOM",
} as const;

// PIX Withdrawals table
export const pixWithdrawals = pgTable("pix_withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  pixKey: text("pix_key").notNull(),
  pixKeyType: varchar("pix_key_type", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  rejectionReason: text("rejection_reason"),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transaction Ledger - Every balance change must create a transaction
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  walletId: varchar("wallet_id").notNull().references(() => wallets.id),
  type: varchar("type", { length: 20 }).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  balanceBefore: numeric("balance_before", { precision: 15, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  referenceId: varchar("reference_id", { length: 150 }).unique(),
  description: text("description"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  transactions: many(transactions),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
  isAdmin: true,
  kycStatus: true,
  vipLevel: true,
});

export const registerUserSchema = z.object({
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres").max(30, "Username deve ter no máximo 30 caracteres").regex(/^[a-zA-Z0-9_]+$/, "Username deve conter apenas letras, números e underscore"),
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().refine(isValidCPF, "CPF inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
});

export const loginUserSchema = z.object({
  identifier: z.string().min(1, "Email ou CPF obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  balance: true,
  bonusBalance: true,
  lockedBalance: true,
  rolloverRemaining: true,
  rolloverTotal: true,
  currency: true,
});

// Transaction schema for creating new transactions
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// PIX deposit schema
export const insertPixDepositSchema = createInsertSchema(pixDeposits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  netAmount: true,
  paidAt: true,
});

// PIX withdrawal schema
export const insertPixWithdrawalSchema = createInsertSchema(pixWithdrawals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  rejectionReason: true,
  transactionId: true,
  approvedBy: true,
  approvedAt: true,
  paidAt: true,
});

// Withdrawal request schema (frontend)
export const requestWithdrawalSchema = z.object({
  amount: z.number().min(20, "Valor mínimo de saque é R$ 20,00"),
  pixKey: z.string().min(1, "Chave PIX obrigatória"),
  pixKeyType: z.enum(["CPF", "EMAIL", "PHONE", "RANDOM"]),
});

// KYC submission schema
export const submitKycSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().refine(isValidCPF, "CPF inválido"),
  birthDate: z.string().optional(),
});

// Bonus schemas
export const insertBonusSchema = createInsertSchema(bonuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserBonusSchema = createInsertSchema(userBonuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const createBonusSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  type: z.enum(["FIRST_DEPOSIT", "RELOAD", "CASHBACK", "FREE_BET", "VIP"]),
  percentage: z.number().min(1).max(500),
  maxValue: z.number().min(1),
  rolloverMultiplier: z.number().min(1).max(100),
  minDeposit: z.number().min(0).optional(),
  isFirstDepositOnly: z.boolean().optional(),
  validDays: z.number().min(1).max(365).optional(),
});

// Admin Roles
export const AdminRole = {
  USER: "USER",
  ADMIN: "ADMIN",
  SECURITY: "SECURITY",
  FINANCIAL: "FINANCIAL",
  SUPPORT: "SUPPORT",
} as const;

// KYC Document Types
export const KycDocumentType = {
  RG: "RG",
  CNH: "CNH",
} as const;

// KYC Verification Status (detailed)
export const KycVerificationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

// KYC Verifications table - Document-based verification
export const kycVerifications = pgTable("kyc_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  documentType: varchar("document_type", { length: 10 }).notNull(),
  documentFrontUrl: text("document_front_url").notNull(),
  documentBackUrl: text("document_back_url"),
  selfieUrl: text("selfie_url").notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  rejectionReason: text("rejection_reason"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Security Audit Logs - Immutable security logs
export const securityLogs = pgTable("security_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  targetType: varchar("target_type", { length: 30 }).notNull(),
  targetId: varchar("target_id", { length: 100 }).notNull(),
  userId: varchar("user_id").references(() => users.id),
  details: text("details"),
  reason: text("reason"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Security Actions
export const SecurityAction = {
  KYC_APPROVE: "KYC_APPROVE",
  KYC_REJECT: "KYC_REJECT",
  KYC_SUBMIT: "KYC_SUBMIT",
  FRAUD_FLAG: "FRAUD_FLAG",
  FRAUD_CLEAR: "FRAUD_CLEAR",
} as const;

// Admin Audit Log Actions
export const AdminAction = {
  USER_BLOCK: "USER_BLOCK",
  USER_UNBLOCK: "USER_UNBLOCK",
  WITHDRAWAL_APPROVE: "WITHDRAWAL_APPROVE",
  WITHDRAWAL_REJECT: "WITHDRAWAL_REJECT",
  WITHDRAWAL_PAY: "WITHDRAWAL_PAY",
  WITHDRAWAL_AUTO_PAY: "WITHDRAWAL_AUTO_PAY",
  BONUS_CREATE: "BONUS_CREATE",
  BONUS_UPDATE: "BONUS_UPDATE",
  BONUS_TOGGLE: "BONUS_TOGGLE",
  USER_BONUS_CANCEL: "USER_BONUS_CANCEL",
  USER_MAKE_ADMIN: "USER_MAKE_ADMIN",
  USER_REMOVE_ADMIN: "USER_REMOVE_ADMIN",
  SETTING_UPDATE: "SETTING_UPDATE",
  USER_AUTO_WITHDRAW_TOGGLE: "USER_AUTO_WITHDRAW_TOGGLE",
  AFFILIATE_CREATE: "AFFILIATE_CREATE",
  AFFILIATE_UPDATE: "AFFILIATE_UPDATE",
  AFFILIATE_SUSPEND: "AFFILIATE_SUSPEND",
  AFFILIATE_ACTIVATE: "AFFILIATE_ACTIVATE",
  AFFILIATE_LINK_CREATE: "AFFILIATE_LINK_CREATE",
  AFFILIATE_LINK_TOGGLE: "AFFILIATE_LINK_TOGGLE",
  AFFILIATE_CONVERSION_APPROVE: "AFFILIATE_CONVERSION_APPROVE",
  AFFILIATE_CONVERSION_CANCEL: "AFFILIATE_CONVERSION_CANCEL",
  AFFILIATE_CONVERSION_FRAUD: "AFFILIATE_CONVERSION_FRAUD",
  AFFILIATE_PAYOUT_APPROVE: "AFFILIATE_PAYOUT_APPROVE",
  AFFILIATE_PAYOUT_REJECT: "AFFILIATE_PAYOUT_REJECT",
  AFFILIATE_PAYOUT_PAY: "AFFILIATE_PAYOUT_PAY",
  AFFILIATE_PAYOUT_RESERVED: "AFFILIATE_PAYOUT_RESERVED",
  AFFILIATE_PAYOUT_RELEASED: "AFFILIATE_PAYOUT_RELEASED",
  AUTO_WITHDRAW_LIMIT_EXCEEDED: "AUTO_WITHDRAW_LIMIT_EXCEEDED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED: "PASSWORD_RESET_COMPLETED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  USER_SETTINGS_UPDATED: "USER_SETTINGS_UPDATED",
} as const;

// Admin Audit Logs table
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  targetType: varchar("target_type", { length: 30 }).notNull(),
  targetId: varchar("target_id", { length: 100 }).notNull(),
  dataBefore: text("data_before"),
  dataAfter: text("data_after"),
  reason: text("reason"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =============================================
// SETTINGS TABLE - Global platform configuration
// =============================================
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Settings Keys
export const SettingsKey = {
  PIX_AUTO_WITHDRAW_GLOBAL: "PIX_AUTO_WITHDRAW_GLOBAL",
  MAX_AUTO_WITHDRAW_AMOUNT: "MAX_AUTO_WITHDRAW_AMOUNT",
  AFFILIATE_MATURATION_DAYS: "AFFILIATE_MATURATION_DAYS",
  REVSHARE_USE_REAL_PNL: "REVSHARE_USE_REAL_PNL",
} as const;

// =============================================
// AFFILIATE SYSTEM TABLES
// =============================================

// Affiliate Status
export const AffiliateStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

// Commission Types
export const CommissionType = {
  CPA: "CPA",
  REVSHARE: "REVSHARE",
  HYBRID: "HYBRID",
} as const;

// Conversion Status
export const ConversionStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
  FRAUD: "FRAUD",
} as const;

// Payout Status
export const PayoutStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  PAID: "PAID",
  REJECTED: "REJECTED",
} as const;

// Affiliates table
export const affiliates = pgTable("affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
  commissionType: varchar("commission_type", { length: 20 }).default("CPA").notNull(),
  cpaValue: numeric("cpa_value", { precision: 15, scale: 2 }).default("50.00").notNull(),
  revsharePercentage: numeric("revshare_percentage", { precision: 5, scale: 2 }).default("30.00").notNull(),
  minDepositForCpa: numeric("min_deposit_for_cpa", { precision: 15, scale: 2 }).default("50.00").notNull(),
  minWagerForCpa: numeric("min_wager_for_cpa", { precision: 15, scale: 2 }).default("100.00").notNull(),
  totalEarnings: numeric("total_earnings", { precision: 15, scale: 2 }).default("0.00").notNull(),
  pendingBalance: numeric("pending_balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  lockedBalance: numeric("locked_balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  paidBalance: numeric("paid_balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  totalReferrals: numeric("total_referrals", { precision: 10, scale: 0 }).default("0").notNull(),
  qualifiedReferrals: numeric("qualified_referrals", { precision: 10, scale: 0 }).default("0").notNull(),
  isFraudSuspect: boolean("is_fraud_suspect").default(false),
  fraudReason: text("fraud_reason"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Affiliate Links table
export const affiliateLinks = pgTable("affiliate_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name"),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  clicks: numeric("clicks", { precision: 15, scale: 0 }).default("0").notNull(),
  registrations: numeric("registrations", { precision: 15, scale: 0 }).default("0").notNull(),
  conversions: numeric("conversions", { precision: 15, scale: 0 }).default("0").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Affiliate Conversions table
export const affiliateConversions = pgTable("affiliate_conversions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  affiliateLinkId: varchar("affiliate_link_id").references(() => affiliateLinks.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  depositAmount: numeric("deposit_amount", { precision: 15, scale: 2 }).default("0.00").notNull(),
  wagerAmount: numeric("wager_amount", { precision: 15, scale: 2 }).default("0.00").notNull(),
  netRevenue: numeric("net_revenue", { precision: 15, scale: 2 }).default("0.00").notNull(),
  commissionType: varchar("commission_type", { length: 20 }).notNull(),
  commissionValue: numeric("commission_value", { precision: 15, scale: 2 }).default("0.00").notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  qualifiedAt: timestamp("qualified_at"),
  maturesAt: timestamp("matures_at"),
  fraudReason: text("fraud_reason"),
  userIp: varchar("user_ip", { length: 45 }),
  userDevice: text("user_device"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Affiliate Payouts table
export const affiliatePayouts = pgTable("affiliate_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  pixKey: text("pix_key").notNull(),
  pixKeyType: varchar("pix_key_type", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Affiliate Clicks tracking (for analytics)
export const affiliateClicks = pgTable("affiliate_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateLinkId: varchar("affiliate_link_id").notNull().references(() => affiliateLinks.id),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referer: text("referer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =============================================
// BETTING SYSTEM TABLES
// =============================================

// Bet Status
export const BetStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  WON: "WON",
  LOST: "LOST",
  CANCELLED: "CANCELLED",
  TIMEOUT: "TIMEOUT",
} as const;

// Game Types
export const GameType = {
  MINES: "MINES",
  CRASH: "CRASH",
  PLINKO: "PLINKO",
  DOUBLE: "DOUBLE",
  SLOTS: "SLOTS",
  SPORTS: "SPORTS",
} as const;

// Bets table - Central betting ledger
export const bets = pgTable("bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  gameType: varchar("game_type", { length: 30 }).notNull(),
  gameId: varchar("game_id", { length: 100 }),
  betAmount: numeric("bet_amount", { precision: 15, scale: 2 }).notNull(),
  winAmount: numeric("win_amount", { precision: 15, scale: 2 }).default("0.00").notNull(),
  profit: numeric("profit", { precision: 15, scale: 2 }).default("0.00").notNull(),
  multiplier: numeric("multiplier", { precision: 10, scale: 4 }).default("1.0000").notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  serverSeed: text("server_seed"),
  clientSeed: text("client_seed"),
  nonce: numeric("nonce", { precision: 15, scale: 0 }),
  serverSeedHash: text("server_seed_hash"),
  gamePayload: text("game_payload"),
  gameResult: text("game_result"),
  reserveTransactionId: varchar("reserve_transaction_id").references(() => transactions.id),
  settleTransactionId: varchar("settle_transaction_id").references(() => transactions.id),
  usedBonusBalance: boolean("used_bonus_balance").default(false),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Mines Game State - Persists active games across restarts
export const minesGames = pgTable("mines_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  betId: varchar("bet_id").notNull().references(() => bets.id).unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  minePositions: text("mine_positions").notNull(),
  mineCount: numeric("mine_count", { precision: 2, scale: 0 }).notNull(),
  revealed: text("revealed").default("[]").notNull(),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =============================================
// PLAYFIVERS INTEGRATION TABLES
// =============================================

// PlayFivers Provider Status
export const PlayfiversProviderStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

// PlayFivers Game Status
export const PlayfiversGameStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

// PlayFivers Session Status
export const PlayfiversSessionStatus = {
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
} as const;

// PlayFivers Transaction Type
export const PlayfiversTransactionType = {
  BALANCE: "BALANCE",
  BET: "Bet",
  WIN_BET: "WinBet",
  REFUND: "Refund",
} as const;

// PlayFivers Transaction Status
export const PlayfiversTransactionStatus = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  DUPLICATE: "DUPLICATE",
} as const;

// PlayFivers Providers - Cache of available game providers
export const playfiversProviders = pgTable("playfivers_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: numeric("external_id", { precision: 15, scale: 0 }).notNull().unique(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  walletName: text("wallet_name"),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PlayFivers Games - Cache of available games
export const playfiversGames = pgTable("playfivers_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameCode: varchar("game_code", { length: 100 }).notNull().unique(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  providerId: varchar("provider_id").references(() => playfiversProviders.id),
  providerName: varchar("provider_name", { length: 100 }).notNull(),
  isOriginal: boolean("is_original").default(false).notNull(),
  supportsFreeRounds: boolean("supports_free_rounds").default(false).notNull(),
  gameType: varchar("game_type", { length: 30 }).default("slot"),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PlayFivers Sessions - Track active game sessions
export const playfiversSessions = pgTable("playfivers_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  gameId: varchar("game_id").references(() => playfiversGames.id),
  gameCode: varchar("game_code", { length: 100 }).notNull(),
  providerName: varchar("provider_name", { length: 100 }).notNull(),
  launchUrl: text("launch_url").notNull(),
  balanceAtStart: numeric("balance_at_start", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PlayFivers Transactions - Track all webhook transactions for idempotency and audit
export const playfiversTransactions = pgTable("playfivers_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalTransactionId: varchar("external_transaction_id", { length: 200 }).notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionId: varchar("session_id").references(() => playfiversSessions.id),
  transactionType: varchar("transaction_type", { length: 30 }).notNull(),
  gameCode: varchar("game_code", { length: 100 }),
  providerName: varchar("provider_name", { length: 100 }),
  betAmount: numeric("bet_amount", { precision: 15, scale: 2 }).default("0.00"),
  winAmount: numeric("win_amount", { precision: 15, scale: 2 }).default("0.00"),
  balanceBefore: numeric("balance_before", { precision: 15, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("SUCCESS").notNull(),
  walletTransactionId: varchar("wallet_transaction_id").references(() => transactions.id),
  rawPayload: text("raw_payload"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// PlayFivers Relations
export const playfiversProvidersRelations = relations(playfiversProviders, ({ many }) => ({
  games: many(playfiversGames),
}));

export const playfiversGamesRelations = relations(playfiversGames, ({ one, many }) => ({
  provider: one(playfiversProviders, {
    fields: [playfiversGames.providerId],
    references: [playfiversProviders.id],
  }),
  sessions: many(playfiversSessions),
}));

export const playfiversSessionsRelations = relations(playfiversSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [playfiversSessions.userId],
    references: [users.id],
  }),
  game: one(playfiversGames, {
    fields: [playfiversSessions.gameId],
    references: [playfiversGames.id],
  }),
  transactions: many(playfiversTransactions),
}));

export const playfiversTransactionsRelations = relations(playfiversTransactions, ({ one }) => ({
  user: one(users, {
    fields: [playfiversTransactions.userId],
    references: [users.id],
  }),
  session: one(playfiversSessions, {
    fields: [playfiversTransactions.sessionId],
    references: [playfiversSessions.id],
  }),
  walletTransaction: one(transactions, {
    fields: [playfiversTransactions.walletTransactionId],
    references: [transactions.id],
  }),
}));

// =============================================
// SLOTSGATEWAY INTEGRATION TABLES
// =============================================

export const SlotsgatewayProviderStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export const SlotsgatewayGameStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export const SlotsgatewayPlayerStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

export const SlotsgatewayTransactionType = {
  BALANCE: "BALANCE",
  BET: "BET",
  WIN: "WIN",
  REFUND: "REFUND",
} as const;

export const SlotsgatewayTransactionStatus = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  DUPLICATE: "DUPLICATE",
} as const;

export const slotsgatewayProviders = pgTable("slotsgateway_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const slotsgatewayGames = pgTable("slotsgateway_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  idHash: varchar("id_hash", { length: 200 }).notNull().unique(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  imageSquare: text("image_square"),
  imagePortrait: text("image_portrait"),
  providerId: varchar("provider_id").references(() => slotsgatewayProviders.id),
  providerSlug: varchar("provider_slug", { length: 100 }).notNull(),
  gameType: varchar("game_type", { length: 50 }).default("video-slots"),
  subcategory: varchar("subcategory", { length: 50 }),
  isMobile: boolean("is_mobile").default(true),
  isNew: boolean("is_new").default(false),
  hasJackpot: boolean("has_jackpot").default(false),
  supportsFreeRounds: boolean("supports_free_rounds").default(false),
  supportsFeatureBuy: boolean("supports_feature_buy").default(false),
  supportsPlayForFun: boolean("supports_play_for_fun").default(true),
  currency: varchar("currency", { length: 10 }).default("BRL"),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const slotsgatewayPlayers = pgTable("slotsgateway_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 100 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("BRL"),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const slotsgatewayTransactions = pgTable("slotsgateway_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalTransactionId: varchar("external_transaction_id", { length: 200 }).notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  playerId: varchar("player_id").references(() => slotsgatewayPlayers.id),
  transactionType: varchar("transaction_type", { length: 30 }).notNull(),
  gameIdHash: varchar("game_id_hash", { length: 200 }),
  roundId: varchar("round_id", { length: 200 }),
  betAmount: numeric("bet_amount", { precision: 15, scale: 2 }).default("0.00"),
  winAmount: numeric("win_amount", { precision: 15, scale: 2 }).default("0.00"),
  balanceBefore: numeric("balance_before", { precision: 15, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("SUCCESS").notNull(),
  walletTransactionId: varchar("wallet_transaction_id").references(() => transactions.id),
  rawPayload: text("raw_payload"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const slotsgatewayProvidersRelations = relations(slotsgatewayProviders, ({ many }) => ({
  games: many(slotsgatewayGames),
}));

export const slotsgatewayGamesRelations = relations(slotsgatewayGames, ({ one }) => ({
  provider: one(slotsgatewayProviders, {
    fields: [slotsgatewayGames.providerId],
    references: [slotsgatewayProviders.id],
  }),
}));

export const slotsgatewayPlayersRelations = relations(slotsgatewayPlayers, ({ one, many }) => ({
  user: one(users, {
    fields: [slotsgatewayPlayers.userId],
    references: [users.id],
  }),
  transactions: many(slotsgatewayTransactions),
}));

export const slotsgatewayTransactionsRelations = relations(slotsgatewayTransactions, ({ one }) => ({
  user: one(users, {
    fields: [slotsgatewayTransactions.userId],
    references: [users.id],
  }),
  player: one(slotsgatewayPlayers, {
    fields: [slotsgatewayTransactions.playerId],
    references: [slotsgatewayPlayers.id],
  }),
  walletTransaction: one(transactions, {
    fields: [slotsgatewayTransactions.walletTransactionId],
    references: [transactions.id],
  }),
}));

// =============================================
// ENTERPRISE SUPPORT SYSTEM TABLES
// =============================================

// Support Department Status
export const SupportDepartmentStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

// Support Agent Role
export const SupportAgentRole = {
  JUNIOR: "JUNIOR",
  SENIOR: "SENIOR",
  SUPERVISOR: "SUPERVISOR",
} as const;

// Support Chat Status
export const SupportChatStatus = {
  WAITING: "WAITING",
  ACTIVE: "ACTIVE",
  TRANSFERRED: "TRANSFERRED",
  CLOSED: "CLOSED",
} as const;

// Support Ticket Status
export const SupportTicketStatus = {
  OPEN: "OPEN",
  WAITING_USER: "WAITING_USER",
  WAITING_INTERNAL: "WAITING_INTERNAL",
  ESCALATED: "ESCALATED",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

// Support Ticket Priority
export const SupportTicketPriority = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
  VIP: "VIP",
} as const;

// Support Message Sender Type
export const SupportSenderType = {
  USER: "USER",
  ADMIN: "ADMIN",
  SYSTEM: "SYSTEM",
  BOT: "BOT",
} as const;

// Support Triage Category
export const SupportTriageCategory = {
  WITHDRAWAL: "WITHDRAWAL",
  DEPOSIT: "DEPOSIT",
  KYC: "KYC",
  BONUS: "BONUS",
  TECHNICAL: "TECHNICAL",
  ACCOUNT: "ACCOUNT",
  GAME: "GAME",
  OTHER: "OTHER",
} as const;

// Support Departments table
export const supportDepartments = pgTable("support_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  priorityWeight: numeric("priority_weight", { precision: 5, scale: 0 }).default("1").notNull(),
  workingHours: text("working_hours"), // JSON: {start: "09:00", end: "18:00", timezone: "America/Sao_Paulo", days: [1,2,3,4,5]}
  autoAssign: boolean("auto_assign").default(true).notNull(),
  maxQueueSize: numeric("max_queue_size", { precision: 5, scale: 0 }).default("50").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Admin-Department relationship (which admins belong to which departments)
export const adminDepartments = pgTable("admin_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  departmentId: varchar("department_id").notNull().references(() => supportDepartments.id),
  role: varchar("role", { length: 20 }).default("JUNIOR").notNull(),
  maxConcurrentChats: numeric("max_concurrent_chats", { precision: 3, scale: 0 }).default("5").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support Chats table (live chat sessions)
export const supportChats = pgTable("support_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  departmentId: varchar("department_id").references(() => supportDepartments.id),
  assignedAdminId: varchar("assigned_admin_id").references(() => users.id),
  status: varchar("status", { length: 20 }).default("WAITING").notNull(),
  priority: varchar("priority", { length: 20 }).default("NORMAL").notNull(),
  category: varchar("category", { length: 30 }),
  tags: text("tags"), // JSON array of tags
  queuePosition: numeric("queue_position", { precision: 10, scale: 0 }),
  triageCompleted: boolean("triage_completed").default(false).notNull(),
  triageResponse: text("triage_response"), // JSON with bot classification
  userRating: numeric("user_rating", { precision: 1, scale: 0 }), // 1-5 stars
  userFeedback: text("user_feedback"),
  startedAt: timestamp("started_at"),
  closedAt: timestamp("closed_at"),
  closedBy: varchar("closed_by").references(() => users.id),
  closeReason: text("close_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support Chat Messages table
export const supportChatMessages = pgTable("support_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => supportChats.id),
  senderType: varchar("sender_type", { length: 20 }).notNull(), // USER, ADMIN, SYSTEM, BOT
  senderId: varchar("sender_id").references(() => users.id), // nullable for SYSTEM/BOT
  message: text("message").notNull(),
  attachments: text("attachments"), // JSON array of attachment URLs
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Support Chat Transfers table (tracks department transfers)
export const supportChatTransfers = pgTable("support_chat_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => supportChats.id),
  fromDepartmentId: varchar("from_department_id").references(() => supportDepartments.id),
  toDepartmentId: varchar("to_department_id").notNull().references(() => supportDepartments.id),
  fromAdminId: varchar("from_admin_id").references(() => users.id),
  toAdminId: varchar("to_admin_id").references(() => users.id),
  transferredByAdminId: varchar("transferred_by_admin_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Support Tickets table (async support requests)
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: varchar("ticket_number", { length: 20 }).notNull().unique(), // Human readable: SUP-2024-0001
  userId: varchar("user_id").notNull().references(() => users.id),
  departmentId: varchar("department_id").references(() => supportDepartments.id),
  assignedAdminId: varchar("assigned_admin_id").references(() => users.id),
  fromChatId: varchar("from_chat_id").references(() => supportChats.id), // If converted from chat
  subject: text("subject").notNull(),
  status: varchar("status", { length: 20 }).default("OPEN").notNull(),
  priority: varchar("priority", { length: 20 }).default("NORMAL").notNull(),
  category: varchar("category", { length: 30 }),
  tags: text("tags"), // JSON array of tags
  escalationLevel: numeric("escalation_level", { precision: 2, scale: 0 }).default("0").notNull(),
  slaDeadline: timestamp("sla_deadline"),
  slaBreached: boolean("sla_breached").default(false).notNull(),
  firstResponseAt: timestamp("first_response_at"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  closedAt: timestamp("closed_at"),
  closedBy: varchar("closed_by").references(() => users.id),
  userRating: numeric("user_rating", { precision: 1, scale: 0 }), // 1-5 stars
  userFeedback: text("user_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support Ticket Messages table
export const supportTicketMessages = pgTable("support_ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => supportTickets.id),
  senderType: varchar("sender_type", { length: 20 }).notNull(), // USER, ADMIN, SYSTEM
  senderId: varchar("sender_id").references(() => users.id),
  message: text("message").notNull(),
  attachments: text("attachments"), // JSON array of attachment URLs
  isInternal: boolean("is_internal").default(false).notNull(), // Internal notes not visible to user
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Support Ticket Escalations table
export const supportTicketEscalations = pgTable("support_ticket_escalations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => supportTickets.id),
  fromLevel: numeric("from_level", { precision: 2, scale: 0 }).notNull(),
  toLevel: numeric("to_level", { precision: 2, scale: 0 }).notNull(),
  fromAdminId: varchar("from_admin_id").references(() => users.id),
  toAdminId: varchar("to_admin_id").references(() => users.id),
  escalatedBy: varchar("escalated_by").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  isAutomatic: boolean("is_automatic").default(false).notNull(), // SLA breach auto-escalation
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Support Canned Responses (pre-defined responses for agents)
export const supportCannedResponses = pgTable("support_canned_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: varchar("department_id").references(() => supportDepartments.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 30 }),
  shortcut: varchar("shortcut", { length: 20 }), // e.g., "/kyc" to insert response
  isActive: boolean("is_active").default(true).notNull(),
  usageCount: numeric("usage_count", { precision: 10, scale: 0 }).default("0").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support SLA Rules table
export const supportSlaRules = pgTable("support_sla_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  departmentId: varchar("department_id").references(() => supportDepartments.id),
  priority: varchar("priority", { length: 20 }).notNull(),
  firstResponseMinutes: numeric("first_response_minutes", { precision: 10, scale: 0 }).notNull(),
  resolutionMinutes: numeric("resolution_minutes", { precision: 10, scale: 0 }).notNull(),
  escalateAfterMinutes: numeric("escalate_after_minutes", { precision: 10, scale: 0 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support Audit Logs table (complete audit trail)
export const supportAuditLogs = pgTable("support_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type", { length: 30 }).notNull(), // CHAT, TICKET, DEPARTMENT, AGENT
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // CREATED, ASSIGNED, TRANSFERRED, ESCALATED, CLOSED, etc
  adminId: varchar("admin_id").references(() => users.id),
  userId: varchar("user_id").references(() => users.id),
  dataBefore: text("data_before"), // JSON snapshot before
  dataAfter: text("data_after"), // JSON snapshot after
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Triage Rules table (for intelligent routing)
export const supportTriageRules = pgTable("support_triage_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  keywords: text("keywords").notNull(), // JSON array of keywords to match
  category: varchar("category", { length: 30 }).notNull(),
  departmentId: varchar("department_id").references(() => supportDepartments.id),
  priority: varchar("priority", { length: 20 }).default("NORMAL").notNull(),
  autoResponse: text("auto_response"), // Automatic response if matched
  canAutoResolve: boolean("can_auto_resolve").default(false).notNull(),
  priorityOrder: numeric("priority_order", { precision: 5, scale: 0 }).default("100").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  matchCount: numeric("match_count", { precision: 15, scale: 0 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support Department Relations
export const supportDepartmentsRelations = relations(supportDepartments, ({ many }) => ({
  adminDepartments: many(adminDepartments),
  chats: many(supportChats),
  tickets: many(supportTickets),
  cannedResponses: many(supportCannedResponses),
  slaRules: many(supportSlaRules),
  triageRules: many(supportTriageRules),
}));

export const adminDepartmentsRelations = relations(adminDepartments, ({ one }) => ({
  admin: one(users, {
    fields: [adminDepartments.adminId],
    references: [users.id],
  }),
  department: one(supportDepartments, {
    fields: [adminDepartments.departmentId],
    references: [supportDepartments.id],
  }),
}));

export const supportChatsRelations = relations(supportChats, ({ one, many }) => ({
  user: one(users, {
    fields: [supportChats.userId],
    references: [users.id],
  }),
  department: one(supportDepartments, {
    fields: [supportChats.departmentId],
    references: [supportDepartments.id],
  }),
  assignedAdmin: one(users, {
    fields: [supportChats.assignedAdminId],
    references: [users.id],
  }),
  messages: many(supportChatMessages),
  transfers: many(supportChatTransfers),
}));

export const supportChatMessagesRelations = relations(supportChatMessages, ({ one }) => ({
  chat: one(supportChats, {
    fields: [supportChatMessages.chatId],
    references: [supportChats.id],
  }),
  sender: one(users, {
    fields: [supportChatMessages.senderId],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  department: one(supportDepartments, {
    fields: [supportTickets.departmentId],
    references: [supportDepartments.id],
  }),
  assignedAdmin: one(users, {
    fields: [supportTickets.assignedAdminId],
    references: [users.id],
  }),
  fromChat: one(supportChats, {
    fields: [supportTickets.fromChatId],
    references: [supportChats.id],
  }),
  messages: many(supportTicketMessages),
  escalations: many(supportTicketEscalations),
}));

export const supportTicketMessagesRelations = relations(supportTicketMessages, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [supportTicketMessages.ticketId],
    references: [supportTickets.id],
  }),
  sender: one(users, {
    fields: [supportTicketMessages.senderId],
    references: [users.id],
  }),
}));

export const supportTicketEscalationsRelations = relations(supportTicketEscalations, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [supportTicketEscalations.ticketId],
    references: [supportTickets.id],
  }),
  escalatedByUser: one(users, {
    fields: [supportTicketEscalations.escalatedBy],
    references: [users.id],
  }),
}));

// KYC Verification Schemas
export const insertKycVerificationSchema = createInsertSchema(kycVerifications).omit({
  id: true,
  status: true,
  rejectionReason: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
});

export const submitKycDocumentsSchema = z.object({
  documentType: z.enum(["RG", "CNH"]),
  documentFrontUrl: z.string().min(1, "Frente do documento obrigatória"),
  documentBackUrl: z.string().optional(),
  selfieUrl: z.string().min(1, "Selfie obrigatória"),
});

// Security Log Schema
export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type PixDeposit = typeof pixDeposits.$inferSelect;
export type InsertPixDeposit = z.infer<typeof insertPixDepositSchema>;
export type PixWithdrawal = typeof pixWithdrawals.$inferSelect;
export type InsertPixWithdrawal = z.infer<typeof insertPixWithdrawalSchema>;
export type RequestWithdrawal = z.infer<typeof requestWithdrawalSchema>;
export type SubmitKyc = z.infer<typeof submitKycSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type TransactionTypeValue = typeof TransactionType[keyof typeof TransactionType];
export type TransactionStatusValue = typeof TransactionStatus[keyof typeof TransactionStatus];
export type WithdrawalStatusValue = typeof WithdrawalStatus[keyof typeof WithdrawalStatus];
export type KycStatusValue = typeof KycStatus[keyof typeof KycStatus];
export type PixKeyTypeValue = typeof PixKeyType[keyof typeof PixKeyType];
export type Bonus = typeof bonuses.$inferSelect;
export type InsertBonus = z.infer<typeof insertBonusSchema>;
export type CreateBonus = z.infer<typeof createBonusSchema>;
export type UserBonus = typeof userBonuses.$inferSelect;
export type InsertUserBonus = z.infer<typeof insertUserBonusSchema>;
export type BonusTypeValue = typeof BonusType[keyof typeof BonusType];
export type BonusStatusValue = typeof BonusStatus[keyof typeof BonusStatus];
export type UserBonusStatusValue = typeof UserBonusStatus[keyof typeof UserBonusStatus];
export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertKycVerification = z.infer<typeof insertKycVerificationSchema>;
export type SubmitKycDocuments = z.infer<typeof submitKycDocumentsSchema>;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;
export type AdminRoleValue = typeof AdminRole[keyof typeof AdminRole];
export type KycDocumentTypeValue = typeof KycDocumentType[keyof typeof KycDocumentType];
export type KycVerificationStatusValue = typeof KycVerificationStatus[keyof typeof KycVerificationStatus];
export type SecurityActionValue = typeof SecurityAction[keyof typeof SecurityAction];

// Safe user type (without password)
export type SafeUser = Omit<User, 'password'>;

// Settings types
export type Setting = typeof settings.$inferSelect;
export type SettingsKeyValue = typeof SettingsKey[keyof typeof SettingsKey];

// Affiliate types
export type Affiliate = typeof affiliates.$inferSelect;
export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type AffiliateConversion = typeof affiliateConversions.$inferSelect;
export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;

// Betting types
export type MinesGame = typeof minesGames.$inferSelect;
export type AffiliateStatusValue = typeof AffiliateStatus[keyof typeof AffiliateStatus];
export type CommissionTypeValue = typeof CommissionType[keyof typeof CommissionType];
export type ConversionStatusValue = typeof ConversionStatus[keyof typeof ConversionStatus];
export type PayoutStatusValue = typeof PayoutStatus[keyof typeof PayoutStatus];

// Affiliate schemas
export const insertAffiliateSchema = createInsertSchema(affiliates).omit({
  id: true,
  totalEarnings: true,
  pendingBalance: true,
  paidBalance: true,
  totalReferrals: true,
  qualifiedReferrals: true,
  isFraudSuspect: true,
  fraudReason: true,
  createdAt: true,
  updatedAt: true,
});

export const createAffiliateSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  commissionType: z.enum(["CPA", "REVSHARE", "HYBRID"]),
  cpaValue: z.number().min(0).optional(),
  revsharePercentage: z.number().min(0).max(100).optional(),
  minDepositForCpa: z.number().min(0).optional(),
  minWagerForCpa: z.number().min(0).optional(),
});

export const createAffiliateLinkSchema = z.object({
  affiliateId: z.string().uuid(),
  code: z.string().min(3, "Código deve ter pelo menos 3 caracteres").max(50),
  name: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export const requestAffiliatePayoutSchema = z.object({
  amount: z.number().min(50, "Valor mínimo de saque é R$ 50,00"),
  pixKey: z.string().min(1, "Chave PIX obrigatória"),
  pixKeyType: z.enum(["CPF", "EMAIL", "PHONE", "RANDOM"]),
});

export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type CreateAffiliate = z.infer<typeof createAffiliateSchema>;
export type CreateAffiliateLink = z.infer<typeof createAffiliateLinkSchema>;
export type RequestAffiliatePayout = z.infer<typeof requestAffiliatePayoutSchema>;

// Betting schemas
export const insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  winAmount: true,
  profit: true,
  status: true,
  reserveTransactionId: true,
  settleTransactionId: true,
  settledAt: true,
  createdAt: true,
  updatedAt: true,
});

export const placeBetSchema = z.object({
  gameType: z.enum(["MINES", "CRASH", "PLINKO", "DOUBLE", "SLOTS", "SPORTS"]),
  betAmount: z.number().min(1, "Aposta mínima é R$ 1,00").max(10000, "Aposta máxima é R$ 10.000,00"),
  gamePayload: z.record(z.any()).optional(),
  clientSeed: z.string().optional(),
});

export type InsertBet = z.infer<typeof insertBetSchema>;
export type PlaceBet = z.infer<typeof placeBetSchema>;

// Password reset schemas
export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email ou CPF obrigatório"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token obrigatório"),
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
});

// User settings schemas
export const updateUserSettingsSchema = z.object({
  language: z.enum(["pt-BR", "en", "es"]).optional(),
  oddsFormat: z.enum(["decimal", "fractional", "american"]).optional(),
  emailMarketing: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
});

// Password reset types
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;

// User settings types
export type UserSettings = typeof userSettings.$inferSelect;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;

// PlayFivers types
export type PlayfiversProvider = typeof playfiversProviders.$inferSelect;
export type PlayfiversGame = typeof playfiversGames.$inferSelect;
export type PlayfiversSession = typeof playfiversSessions.$inferSelect;
export type PlayfiversTransaction = typeof playfiversTransactions.$inferSelect;
export type PlayfiversProviderStatusValue = typeof PlayfiversProviderStatus[keyof typeof PlayfiversProviderStatus];
export type PlayfiversGameStatusValue = typeof PlayfiversGameStatus[keyof typeof PlayfiversGameStatus];
export type PlayfiversSessionStatusValue = typeof PlayfiversSessionStatus[keyof typeof PlayfiversSessionStatus];
export type PlayfiversTransactionTypeValue = typeof PlayfiversTransactionType[keyof typeof PlayfiversTransactionType];
export type PlayfiversTransactionStatusValue = typeof PlayfiversTransactionStatus[keyof typeof PlayfiversTransactionStatus];

// SlotsGateway Types
export type SlotsgatewayProvider = typeof slotsgatewayProviders.$inferSelect;
export type SlotsgatewayGame = typeof slotsgatewayGames.$inferSelect;
export type SlotsgatewayPlayer = typeof slotsgatewayPlayers.$inferSelect;
export type SlotsgatewayTransaction = typeof slotsgatewayTransactions.$inferSelect;
export type SlotsgatewayProviderStatusValue = typeof SlotsgatewayProviderStatus[keyof typeof SlotsgatewayProviderStatus];
export type SlotsgatewayGameStatusValue = typeof SlotsgatewayGameStatus[keyof typeof SlotsgatewayGameStatus];
export type SlotsgatewayPlayerStatusValue = typeof SlotsgatewayPlayerStatus[keyof typeof SlotsgatewayPlayerStatus];
export type SlotsgatewayTransactionTypeValue = typeof SlotsgatewayTransactionType[keyof typeof SlotsgatewayTransactionType];
export type SlotsgatewayTransactionStatusValue = typeof SlotsgatewayTransactionStatus[keyof typeof SlotsgatewayTransactionStatus];

// SlotsGateway schemas
export const slotsgatewayLaunchGameSchema = z.object({
  gameIdHash: z.string().min(1, "ID do jogo obrigatório"),
  homeUrl: z.string().url().optional(),
  cashierUrl: z.string().url().optional(),
});

export type SlotsgatewayLaunchGame = z.infer<typeof slotsgatewayLaunchGameSchema>;

// PlayFivers schemas
export const launchGameSchema = z.object({
  gameCode: z.string().min(1, "Código do jogo obrigatório"),
  providerName: z.string().min(1, "Nome do provedor obrigatório"),
  isOriginal: z.boolean().optional().default(false),
  lang: z.enum(["pt", "en", "es", "ja", "zh", "ru", "th", "hi"]).optional().default("pt"),
});

export const grantFreeRoundsSchema = z.object({
  gameCode: z.string().min(1, "Código do jogo obrigatório"),
  rounds: z.number().min(1).max(23, "Máximo 23 rodadas grátis"),
});

export type LaunchGame = z.infer<typeof launchGameSchema>;
export type GrantFreeRounds = z.infer<typeof grantFreeRoundsSchema>;

// =============================================
// ENTERPRISE SUPPORT SYSTEM TYPES & SCHEMAS
// =============================================

// Support Types
export type SupportDepartment = typeof supportDepartments.$inferSelect;
export type AdminDepartment = typeof adminDepartments.$inferSelect;
export type SupportChat = typeof supportChats.$inferSelect;
export type SupportChatMessage = typeof supportChatMessages.$inferSelect;
export type SupportChatTransfer = typeof supportChatTransfers.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type SupportTicketEscalation = typeof supportTicketEscalations.$inferSelect;
export type SupportCannedResponse = typeof supportCannedResponses.$inferSelect;
export type SupportSlaRule = typeof supportSlaRules.$inferSelect;
export type SupportAuditLog = typeof supportAuditLogs.$inferSelect;
export type SupportTriageRule = typeof supportTriageRules.$inferSelect;

// Support Status Value Types
export type SupportDepartmentStatusValue = typeof SupportDepartmentStatus[keyof typeof SupportDepartmentStatus];
export type SupportAgentRoleValue = typeof SupportAgentRole[keyof typeof SupportAgentRole];
export type SupportChatStatusValue = typeof SupportChatStatus[keyof typeof SupportChatStatus];
export type SupportTicketStatusValue = typeof SupportTicketStatus[keyof typeof SupportTicketStatus];
export type SupportTicketPriorityValue = typeof SupportTicketPriority[keyof typeof SupportTicketPriority];
export type SupportSenderTypeValue = typeof SupportSenderType[keyof typeof SupportSenderType];
export type SupportTriageCategoryValue = typeof SupportTriageCategory[keyof typeof SupportTriageCategory];

// Support Schemas
export const createSupportDepartmentSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  priorityWeight: z.number().min(1).max(100).optional().default(1),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
    timezone: z.string(),
    days: z.array(z.number().min(0).max(6)),
  }).optional(),
  autoAssign: z.boolean().optional().default(true),
  maxQueueSize: z.number().min(1).max(1000).optional().default(50),
});

export const updateSupportDepartmentSchema = createSupportDepartmentSchema.partial();

export const assignAdminToDepartmentSchema = z.object({
  adminId: z.string().uuid("ID do admin inválido"),
  departmentId: z.string().uuid("ID do departamento inválido"),
  role: z.enum(["JUNIOR", "SENIOR", "SUPERVISOR"]).optional().default("JUNIOR"),
  maxConcurrentChats: z.number().min(1).max(50).optional().default(5),
});

export const createSupportChatSchema = z.object({
  departmentId: z.string().uuid().optional(),
  category: z.enum(["WITHDRAWAL", "DEPOSIT", "KYC", "BONUS", "TECHNICAL", "ACCOUNT", "GAME", "OTHER"]).optional(),
  initialMessage: z.string().min(1, "Mensagem inicial obrigatória"),
});

export const sendChatMessageSchema = z.object({
  chatId: z.string().uuid("ID do chat inválido"),
  message: z.string().min(1, "Mensagem não pode estar vazia"),
  attachments: z.array(z.string().url()).optional(),
});

export const transferChatSchema = z.object({
  chatId: z.string().uuid("ID do chat inválido"),
  toDepartmentId: z.string().uuid("ID do departamento destino inválido"),
  toAdminId: z.string().uuid().optional(),
  reason: z.string().min(3, "Motivo da transferência obrigatório"),
});

export const closeChatSchema = z.object({
  chatId: z.string().uuid("ID do chat inválido"),
  reason: z.string().optional(),
  convertToTicket: z.boolean().optional().default(false),
});

export const rateChatSchema = z.object({
  chatId: z.string().uuid("ID do chat inválido"),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

export const createSupportTicketSchema = z.object({
  subject: z.string().min(5, "Assunto deve ter pelo menos 5 caracteres"),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
  departmentId: z.string().uuid().optional(),
  category: z.enum(["WITHDRAWAL", "DEPOSIT", "KYC", "BONUS", "TECHNICAL", "ACCOUNT", "GAME", "OTHER"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional().default("NORMAL"),
  attachments: z.array(z.string().url()).optional(),
});

export const replyToTicketSchema = z.object({
  ticketId: z.string().uuid("ID do ticket inválido"),
  message: z.string().min(1, "Mensagem não pode estar vazia"),
  attachments: z.array(z.string().url()).optional(),
  isInternal: z.boolean().optional().default(false),
});

export const escalateTicketSchema = z.object({
  ticketId: z.string().uuid("ID do ticket inválido"),
  reason: z.string().min(5, "Motivo do escalonamento obrigatório"),
  toAdminId: z.string().uuid().optional(),
});

export const closeTicketSchema = z.object({
  ticketId: z.string().uuid("ID do ticket inválido"),
  resolution: z.string().optional(),
});

export const rateTicketSchema = z.object({
  ticketId: z.string().uuid("ID do ticket inválido"),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

export const createCannedResponseSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  content: z.string().min(10, "Conteúdo deve ter pelo menos 10 caracteres"),
  departmentId: z.string().uuid().optional(),
  category: z.string().optional(),
  shortcut: z.string().max(20).optional(),
});

export const createSlaRuleSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  departmentId: z.string().uuid().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT", "VIP"]),
  firstResponseMinutes: z.number().min(1, "Tempo de primeira resposta obrigatório"),
  resolutionMinutes: z.number().min(1, "Tempo de resolução obrigatório"),
  escalateAfterMinutes: z.number().optional(),
});

export const createTriageRuleSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  keywords: z.array(z.string()).min(1, "Pelo menos uma palavra-chave obrigatória"),
  category: z.enum(["WITHDRAWAL", "DEPOSIT", "KYC", "BONUS", "TECHNICAL", "ACCOUNT", "GAME", "OTHER"]),
  departmentId: z.string().uuid().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT", "VIP"]).optional().default("NORMAL"),
  autoResponse: z.string().optional(),
  canAutoResolve: z.boolean().optional().default(false),
  priorityOrder: z.number().min(1).optional().default(100),
});

// Support Schema Types
export type CreateSupportDepartment = z.infer<typeof createSupportDepartmentSchema>;
export type UpdateSupportDepartment = z.infer<typeof updateSupportDepartmentSchema>;
export type AssignAdminToDepartment = z.infer<typeof assignAdminToDepartmentSchema>;
export type CreateSupportChat = z.infer<typeof createSupportChatSchema>;
export type SendChatMessage = z.infer<typeof sendChatMessageSchema>;
export type TransferChat = z.infer<typeof transferChatSchema>;
export type CloseChat = z.infer<typeof closeChatSchema>;
export type RateChat = z.infer<typeof rateChatSchema>;
export type CreateSupportTicket = z.infer<typeof createSupportTicketSchema>;
export type ReplyToTicket = z.infer<typeof replyToTicketSchema>;
export type EscalateTicket = z.infer<typeof escalateTicketSchema>;
export type CloseTicket = z.infer<typeof closeTicketSchema>;
export type RateTicket = z.infer<typeof rateTicketSchema>;
export type CreateCannedResponse = z.infer<typeof createCannedResponseSchema>;
export type CreateSlaRule = z.infer<typeof createSlaRuleSchema>;
export type CreateTriageRule = z.infer<typeof createTriageRuleSchema>;

// ==================== LEVEL SYSTEM ====================

export const LevelRewardType = {
  BONUS: "BONUS",
  FREE_SPINS: "FREE_SPINS",
  CASHBACK: "CASHBACK",
  MULTIPLIER: "MULTIPLIER",
  VIP_UPGRADE: "VIP_UPGRADE",
} as const;

export const levelRewards = pgTable("level_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: integer("level").notNull().unique(),
  rewardType: varchar("reward_type", { length: 20 }).notNull(),
  rewardValue: numeric("reward_value", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  xpRequired: integer("xp_required").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyBoxClaims = pgTable("daily_box_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  level: integer("level").notNull(),
  rewardType: varchar("reward_type", { length: 20 }).notNull(),
  rewardValue: numeric("reward_value", { precision: 15, scale: 2 }).notNull(),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
});

export const levelUpHistory = pgTable("level_up_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fromLevel: integer("from_level").notNull(),
  toLevel: integer("to_level").notNull(),
  xpGained: integer("xp_gained").notNull(),
  rewardClaimed: boolean("reward_claimed").default(false),
  rewardValue: numeric("reward_value", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== RESPONSIBLE GAMING ====================

export const ResponsibleGamingActionType = {
  SET_DEPOSIT_LIMIT: "SET_DEPOSIT_LIMIT",
  SET_BET_LIMIT: "SET_BET_LIMIT",
  SET_SESSION_LIMIT: "SET_SESSION_LIMIT",
  SELF_EXCLUDE_TEMP: "SELF_EXCLUDE_TEMP",
  SELF_EXCLUDE_PERMANENT: "SELF_EXCLUDE_PERMANENT",
  REMOVE_LIMIT: "REMOVE_LIMIT",
  REACTIVATE: "REACTIVATE",
} as const;

export const responsibleGamingLogs = pgTable("responsible_gaming_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  actionType: varchar("action_type", { length: 30 }).notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  reason: text("reason"),
  effectiveAt: timestamp("effective_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionAlerts = pgTable("session_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  alertType: varchar("alert_type", { length: 20 }).notNull(),
  sessionDurationMinutes: integer("session_duration_minutes").notNull(),
  acknowledged: boolean("acknowledged").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Level System Schemas
export const setDepositLimitSchema = z.object({
  dailyLimit: z.number().min(0).optional(),
  weeklyLimit: z.number().min(0).optional(),
  monthlyLimit: z.number().min(0).optional(),
});

export const setBetLimitSchema = z.object({
  maxBetLimit: z.number().min(0),
});

export const setSessionLimitSchema = z.object({
  sessionTimeLimit: z.number().min(15).max(480),
});

export const selfExcludeSchema = z.object({
  duration: z.enum(["24h", "7d", "30d", "permanent"]),
  reason: z.string().optional(),
});

export const claimDailyBoxSchema = z.object({});

// Level System Types
export type LevelReward = typeof levelRewards.$inferSelect;
export type DailyBoxClaim = typeof dailyBoxClaims.$inferSelect;
export type LevelUpHistory = typeof levelUpHistory.$inferSelect;
export type ResponsibleGamingLog = typeof responsibleGamingLogs.$inferSelect;
export type SessionAlert = typeof sessionAlerts.$inferSelect;
export type SetDepositLimit = z.infer<typeof setDepositLimitSchema>;
export type SetBetLimit = z.infer<typeof setBetLimitSchema>;
export type SetSessionLimit = z.infer<typeof setSessionLimitSchema>;
export type SelfExclude = z.infer<typeof selfExcludeSchema>;

// =====================================================
// RAKEBACK/CASHBACK SYSTEM
// =====================================================

export const RakebackStatus = {
  PENDING: "PENDING",
  CALCULATED: "CALCULATED",
  PAID: "PAID",
  SKIPPED: "SKIPPED",
} as const;

export const rakebackSettings = pgTable("rakeback_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vipTier: varchar("vip_tier", { length: 20 }).notNull().unique(),
  percentLoss: numeric("percent_loss", { precision: 5, scale: 2 }).notNull(),
  minLossThreshold: numeric("min_loss_threshold", { precision: 15, scale: 2 }).notNull(),
  maxRakebackPercent: numeric("max_rakeback_percent", { precision: 5, scale: 2 }).notNull(),
  rolloverMultiple: integer("rollover_multiple").default(3).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rakebackPeriods = pgTable("rakeback_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  periodType: varchar("period_type", { length: 10 }).default("WEEKLY").notNull(),
  vipTierAtCalculation: varchar("vip_tier_at_calculation", { length: 20 }).notNull(),
  totalWagered: numeric("total_wagered", { precision: 15, scale: 2 }).notNull(),
  totalWins: numeric("total_wins", { precision: 15, scale: 2 }).notNull(),
  netLoss: numeric("net_loss", { precision: 15, scale: 2 }).notNull(),
  rakebackPercent: numeric("rakeback_percent", { precision: 5, scale: 2 }).notNull(),
  rakebackAmount: numeric("rakeback_amount", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rakebackPayouts = pgTable("rakeback_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").notNull().references(() => rakebackPeriods.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  rolloverRequired: numeric("rollover_required", { precision: 15, scale: 2 }).notNull(),
  rolloverCompleted: numeric("rollover_completed", { precision: 15, scale: 2 }).default("0.00").notNull(),
  rolloverStatus: varchar("rollover_status", { length: 20 }).default("PENDING").notNull(),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
});

// =====================================================
// NOTIFICATIONS SYSTEM
// =====================================================

export const NotificationType = {
  PROMOTION: "PROMOTION",
  BET_RESULT: "BET_RESULT",
  LEVEL_UP: "LEVEL_UP",
  DAILY_BOX: "DAILY_BOX",
  RAKEBACK: "RAKEBACK",
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  SECURITY: "SECURITY",
  MISSION: "MISSION",
  SYSTEM: "SYSTEM",
} as const;

export const NotificationPriority = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 30 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  icon: varchar("icon", { length: 50 }),
  actionUrl: varchar("action_url", { length: 500 }),
  imageUrl: varchar("image_url", { length: 500 }),
  priority: varchar("priority", { length: 10 }).default("NORMAL").notNull(),
  targetAudience: varchar("target_audience", { length: 30 }).default("ALL"),
  targetVipTiers: text("target_vip_tiers"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userNotifications = pgTable("user_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  notificationId: varchar("notification_id").references(() => notifications.id),
  type: varchar("type", { length: 30 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  icon: varchar("icon", { length: 50 }),
  actionUrl: varchar("action_url", { length: 500 }),
  priority: varchar("priority", { length: 10 }).default("NORMAL").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  deliveredViaPush: boolean("delivered_via_push").default(false),
  deliveredViaEmail: boolean("delivered_via_email").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  promotionsInApp: boolean("promotions_in_app").default(true).notNull(),
  promotionsPush: boolean("promotions_push").default(true).notNull(),
  promotionsEmail: boolean("promotions_email").default(false).notNull(),
  betResultsInApp: boolean("bet_results_in_app").default(true).notNull(),
  betResultsPush: boolean("bet_results_push").default(true).notNull(),
  levelUpInApp: boolean("level_up_in_app").default(true).notNull(),
  levelUpPush: boolean("level_up_push").default(true).notNull(),
  dailyBoxInApp: boolean("daily_box_in_app").default(true).notNull(),
  dailyBoxPush: boolean("daily_box_push").default(true).notNull(),
  rakebackInApp: boolean("rakeback_in_app").default(true).notNull(),
  rakebackPush: boolean("rakeback_push").default(true).notNull(),
  depositsInApp: boolean("deposits_in_app").default(true).notNull(),
  depositsPush: boolean("deposits_push").default(true).notNull(),
  withdrawalsInApp: boolean("withdrawals_in_app").default(true).notNull(),
  withdrawalsPush: boolean("withdrawals_push").default(true).notNull(),
  securityInApp: boolean("security_in_app").default(true).notNull(),
  securityPush: boolean("security_push").default(true).notNull(),
  securityEmail: boolean("security_email").default(true).notNull(),
  missionsInApp: boolean("missions_in_app").default(true).notNull(),
  missionsPush: boolean("missions_push").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});

// =====================================================
// MISSIONS/CHALLENGES SYSTEM
// =====================================================

export const MissionCadence = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  EVENT: "EVENT",
} as const;

export const MissionStatus = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CLAIMED: "CLAIMED",
  EXPIRED: "EXPIRED",
} as const;

export const MissionRequirementType = {
  BET_COUNT: "BET_COUNT",
  BET_AMOUNT: "BET_AMOUNT",
  WIN_COUNT: "WIN_COUNT",
  WIN_AMOUNT: "WIN_AMOUNT",
  PLAY_GAME: "PLAY_GAME",
  PLAY_GAME_TYPE: "PLAY_GAME_TYPE",
  DEPOSIT: "DEPOSIT",
  CLAIM_DAILY_BOX: "CLAIM_DAILY_BOX",
  LEVEL_UP: "LEVEL_UP",
  LOGIN_STREAK: "LOGIN_STREAK",
} as const;

// ==========================================
// SPORTS BETTING SCHEMA
// ==========================================

export const SportType = {
  FOOTBALL: "FOOTBALL",
  BASKETBALL: "BASKETBALL",
  TENNIS: "TENNIS",
  VOLLEYBALL: "VOLLEYBALL",
  ESPORTS: "ESPORTS",
  MMA: "MMA",
  BOXING: "BOXING",
  BASEBALL: "BASEBALL",
  HOCKEY: "HOCKEY",
  AMERICAN_FOOTBALL: "AMERICAN_FOOTBALL",
} as const;

export const MatchStatus = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  FINISHED: "FINISHED",
  CANCELLED: "CANCELLED",
  POSTPONED: "POSTPONED",
} as const;

export const SportBetStatus = {
  PENDING: "PENDING",
  WON: "WON",
  LOST: "LOST",
  VOID: "VOID",
  CASHOUT: "CASHOUT",
} as const;

export const BetType = {
  SINGLE: "SINGLE",
  MULTIPLE: "MULTIPLE",
  SYSTEM: "SYSTEM",
} as const;

export const MarketType = {
  MATCH_WINNER: "MATCH_WINNER",
  DOUBLE_CHANCE: "DOUBLE_CHANCE",
  OVER_UNDER: "OVER_UNDER",
  BOTH_TEAMS_SCORE: "BOTH_TEAMS_SCORE",
  CORRECT_SCORE: "CORRECT_SCORE",
  HALF_TIME_RESULT: "HALF_TIME_RESULT",
  HANDICAP: "HANDICAP",
  FIRST_GOAL: "FIRST_GOAL",
  TOTAL_GOALS: "TOTAL_GOALS",
  PLAYER_PROPS: "PLAYER_PROPS",
} as const;

export const sportsLeagues = pgTable("sports_leagues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  country: varchar("country", { length: 100 }),
  countryCode: varchar("country_code", { length: 3 }),
  sport: varchar("sport", { length: 30 }).notNull(),
  logo: text("logo"),
  isPopular: boolean("is_popular").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  externalId: varchar("external_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sportsTeams = pgTable("sports_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  shortName: varchar("short_name", { length: 50 }),
  logo: text("logo"),
  country: varchar("country", { length: 100 }),
  sport: varchar("sport", { length: 30 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  externalId: varchar("external_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sportsMatches = pgTable("sports_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull().references(() => sportsLeagues.id),
  homeTeamId: varchar("home_team_id").notNull().references(() => sportsTeams.id),
  awayTeamId: varchar("away_team_id").notNull().references(() => sportsTeams.id),
  sport: varchar("sport", { length: 30 }).notNull(),
  startsAt: timestamp("starts_at").notNull(),
  status: varchar("status", { length: 20 }).default("SCHEDULED").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  period: varchar("period", { length: 50 }),
  minute: integer("minute"),
  isLive: boolean("is_live").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  streamUrl: text("stream_url"),
  result: varchar("result", { length: 10 }),
  externalId: varchar("external_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sportsOdds = pgTable("sports_odds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => sportsMatches.id),
  marketType: varchar("market_type", { length: 50 }).notNull(),
  selection: varchar("selection", { length: 100 }).notNull(),
  selectionName: varchar("selection_name", { length: 200 }).notNull(),
  odds: numeric("odds", { precision: 10, scale: 2 }).notNull(),
  line: numeric("line", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true).notNull(),
  isSuspended: boolean("is_suspended").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sportsBetSlips = pgTable("sports_bet_slips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  betNumber: varchar("bet_number", { length: 20 }).notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  betType: varchar("bet_type", { length: 20 }).notNull(),
  totalOdds: numeric("total_odds", { precision: 15, scale: 2 }).notNull(),
  stake: numeric("stake", { precision: 15, scale: 2 }).notNull(),
  potentialWin: numeric("potential_win", { precision: 15, scale: 2 }).notNull(),
  actualWin: numeric("actual_win", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  usedBonus: boolean("used_bonus").default(false).notNull(),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sportsBetSelections = pgTable("sports_bet_selections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  betSlipId: varchar("bet_slip_id").notNull().references(() => sportsBetSlips.id),
  matchId: varchar("match_id").notNull().references(() => sportsMatches.id),
  oddId: varchar("odd_id").notNull().references(() => sportsOdds.id),
  marketType: varchar("market_type", { length: 50 }).notNull(),
  selection: varchar("selection", { length: 100 }).notNull(),
  selectionName: varchar("selection_name", { length: 200 }).notNull(),
  odds: numeric("odds", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  result: varchar("result", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sports Types
export type SportsLeague = typeof sportsLeagues.$inferSelect;
export type InsertSportsLeague = typeof sportsLeagues.$inferInsert;
export type SportsTeam = typeof sportsTeams.$inferSelect;
export type InsertSportsTeam = typeof sportsTeams.$inferInsert;
export type SportsMatch = typeof sportsMatches.$inferSelect;
export type InsertSportsMatch = typeof sportsMatches.$inferInsert;
export type SportsOdd = typeof sportsOdds.$inferSelect;
export type InsertSportsOdd = typeof sportsOdds.$inferInsert;
export type SportsBetSlip = typeof sportsBetSlips.$inferSelect;
export type InsertSportsBetSlip = typeof sportsBetSlips.$inferInsert;
export type SportsBetSelection = typeof sportsBetSelections.$inferSelect;
export type InsertSportsBetSelection = typeof sportsBetSelections.$inferInsert;

// Sports Validation Schemas
export const createSportsLeagueSchema = z.object({
  name: z.string().min(1).max(200),
  country: z.string().max(100).optional(),
  countryCode: z.string().max(3).optional(),
  sport: z.string().min(1).max(30),
  logo: z.string().url().optional(),
  isPopular: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const createSportsTeamSchema = z.object({
  name: z.string().min(1).max(200),
  shortName: z.string().max(50).optional(),
  logo: z.string().url().optional(),
  country: z.string().max(100).optional(),
  sport: z.string().min(1).max(30),
});

export const createSportsMatchSchema = z.object({
  leagueId: z.string().uuid(),
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  sport: z.string().min(1).max(30),
  startsAt: z.string().datetime(),
  isFeatured: z.boolean().optional(),
});

export const createSportsOddSchema = z.object({
  matchId: z.string().uuid(),
  marketType: z.string().min(1).max(50),
  selection: z.string().min(1).max(100),
  selectionName: z.string().min(1).max(200),
  odds: z.number().positive(),
  line: z.number().optional(),
});

export const updateMatchStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "LIVE", "FINISHED", "CANCELLED", "POSTPONED"]),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  period: z.string().max(50).optional(),
  minute: z.number().int().min(0).optional(),
  result: z.enum(["HOME", "AWAY", "DRAW"]).optional(),
});

export const placeSportsBetSchema = z.object({
  selections: z.array(z.object({
    matchId: z.string().uuid(),
    oddId: z.string().uuid(),
    odds: z.number().positive(),
  })).min(1).max(20),
  stake: z.number().positive().min(1),
  betType: z.enum(["SINGLE", "MULTIPLE"]).default("SINGLE"),
  useBonus: z.boolean().optional(),
});

export const MissionRewardType = {
  XP: "XP",
  BONUS_CASH: "BONUS_CASH",
  FREE_SPINS: "FREE_SPINS",
  DAILY_BOX_MULTIPLIER: "DAILY_BOX_MULTIPLIER",
  RAKEBACK_BOOST: "RAKEBACK_BOOST",
} as const;

export const missionTemplates = pgTable("mission_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }),
  cadence: varchar("cadence", { length: 10 }).notNull(),
  requirementType: varchar("requirement_type", { length: 30 }).notNull(),
  requirementTarget: numeric("requirement_target", { precision: 15, scale: 2 }).notNull(),
  requirementMetadata: text("requirement_metadata"),
  rewardType: varchar("reward_type", { length: 30 }).notNull(),
  rewardValue: numeric("reward_value", { precision: 15, scale: 2 }).notNull(),
  rewardMetadata: text("reward_metadata"),
  minVipLevel: varchar("min_vip_level", { length: 20 }).default("bronze"),
  vipRewardMultiplier: numeric("vip_reward_multiplier", { precision: 5, scale: 2 }).default("1.00"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const missionInstances = pgTable("mission_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => missionTemplates.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const missionAssignments = pgTable("mission_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  instanceId: varchar("instance_id").notNull().references(() => missionInstances.id),
  progress: numeric("progress", { precision: 15, scale: 2 }).default("0").notNull(),
  target: numeric("target", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
  completedAt: timestamp("completed_at"),
  claimedAt: timestamp("claimed_at"),
  rewardType: varchar("reward_type", { length: 30 }).notNull(),
  rewardValue: numeric("reward_value", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const missionProgressLogs = pgTable("mission_progress_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => missionAssignments.id),
  sourceEvent: varchar("source_event", { length: 50 }).notNull(),
  sourceId: varchar("source_id", { length: 100 }),
  progressDelta: numeric("progress_delta", { precision: 15, scale: 2 }).notNull(),
  progressAfter: numeric("progress_after", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =====================================================
// STREAK SYSTEM
// =====================================================

export const StreakRewardType = {
  XP: "XP",
  BONUS_CASH: "BONUS_CASH",
  STREAK_PROTECTION: "STREAK_PROTECTION",
} as const;

export const userStreaks = pgTable("user_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastCompletionDate: timestamp("last_completion_date"),
  streakProtections: integer("streak_protections").default(0).notNull(),
  totalMissionsCompleted: integer("total_missions_completed").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const streakRewards = pgTable("streak_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streakDay: integer("streak_day").notNull().unique(),
  rewardType: varchar("reward_type", { length: 30 }).notNull(),
  rewardValue: numeric("reward_value", { precision: 15, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const streakRewardClaims = pgTable("streak_reward_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  streakRewardId: varchar("streak_reward_id").notNull().references(() => streakRewards.id),
  streakDay: integer("streak_day").notNull(),
  rewardType: varchar("reward_type", { length: 30 }).notNull(),
  rewardValue: numeric("reward_value", { precision: 15, scale: 2 }).notNull(),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
});

// Rakeback Types
export type RakebackSetting = typeof rakebackSettings.$inferSelect;
export type InsertRakebackSetting = typeof rakebackSettings.$inferInsert;
export type RakebackPeriod = typeof rakebackPeriods.$inferSelect;
export type InsertRakebackPeriod = typeof rakebackPeriods.$inferInsert;
export type RakebackPayout = typeof rakebackPayouts.$inferSelect;
export type InsertRakebackPayout = typeof rakebackPayouts.$inferInsert;

// Notification Types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = typeof userNotifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// Mission Types
export type MissionTemplate = typeof missionTemplates.$inferSelect;
export type InsertMissionTemplate = typeof missionTemplates.$inferInsert;
export type MissionInstance = typeof missionInstances.$inferSelect;
export type InsertMissionInstance = typeof missionInstances.$inferInsert;
export type MissionAssignment = typeof missionAssignments.$inferSelect;
export type InsertMissionAssignment = typeof missionAssignments.$inferInsert;
export type MissionProgressLog = typeof missionProgressLogs.$inferSelect;
export type InsertMissionProgressLog = typeof missionProgressLogs.$inferInsert;

// Validation Schemas
export const updateNotificationPreferencesSchema = z.object({
  promotionsInApp: z.boolean().optional(),
  promotionsPush: z.boolean().optional(),
  promotionsEmail: z.boolean().optional(),
  betResultsInApp: z.boolean().optional(),
  betResultsPush: z.boolean().optional(),
  levelUpInApp: z.boolean().optional(),
  levelUpPush: z.boolean().optional(),
  dailyBoxInApp: z.boolean().optional(),
  dailyBoxPush: z.boolean().optional(),
  rakebackInApp: z.boolean().optional(),
  rakebackPush: z.boolean().optional(),
  depositsInApp: z.boolean().optional(),
  depositsPush: z.boolean().optional(),
  withdrawalsInApp: z.boolean().optional(),
  withdrawalsPush: z.boolean().optional(),
  securityInApp: z.boolean().optional(),
  securityPush: z.boolean().optional(),
  securityEmail: z.boolean().optional(),
  missionsInApp: z.boolean().optional(),
  missionsPush: z.boolean().optional(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const claimMissionSchema = z.object({
  assignmentId: z.string().uuid(),
});

export const claimRakebackSchema = z.object({
  payoutId: z.string().uuid().optional(),
});

export const markNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()),
});

export const createMissionTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  icon: z.string().optional(),
  cadence: z.enum(["DAILY", "WEEKLY", "EVENT"]),
  requirementType: z.enum([
    "BET_COUNT", "BET_AMOUNT", "WIN_COUNT", "WIN_AMOUNT",
    "PLAY_GAME", "PLAY_GAME_TYPE", "DEPOSIT", "CLAIM_DAILY_BOX",
    "LEVEL_UP", "LOGIN_STREAK"
  ]),
  requirementTarget: z.number().positive(),
  requirementMetadata: z.string().optional(),
  rewardType: z.enum(["XP", "BONUS_CASH", "FREE_SPINS", "DAILY_BOX_MULTIPLIER", "RAKEBACK_BOOST"]),
  rewardValue: z.number().positive(),
  rewardMetadata: z.string().optional(),
  minVipLevel: z.string().optional(),
  vipRewardMultiplier: z.number().min(1).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// Streak Types
export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertUserStreak = typeof userStreaks.$inferInsert;
export type StreakReward = typeof streakRewards.$inferSelect;
export type InsertStreakReward = typeof streakRewards.$inferInsert;
export type StreakRewardClaim = typeof streakRewardClaims.$inferSelect;
export type InsertStreakRewardClaim = typeof streakRewardClaims.$inferInsert;

// Streak Validation Schemas
export const claimStreakRewardSchema = z.object({
  streakDay: z.number().int().positive(),
});

export const createStreakRewardSchema = z.object({
  streakDay: z.number().int().positive(),
  rewardType: z.enum(["XP", "BONUS_CASH", "STREAK_PROTECTION"]),
  rewardValue: z.number().positive(),
  isActive: z.boolean().optional(),
});

// ============================================
// COMMUNITY CHAT SYSTEM
// ============================================

export const ChatRoomType = {
  GLOBAL: "GLOBAL",
  GAME: "GAME",
  VIP: "VIP",
} as const;

export const ChatPenaltyType = {
  WARNING: "WARNING",
  MUTE_5MIN: "MUTE_5MIN",
  MUTE_1HOUR: "MUTE_1HOUR",
  BAN: "BAN",
} as const;

export const ChatViolationType = {
  LINK: "LINK",
  PROFANITY: "PROFANITY",
  SPAM: "SPAM",
  SCAM: "SCAM",
  PHONE_NUMBER: "PHONE_NUMBER",
  MANUAL: "MANUAL",
} as const;

// Chat Rooms
export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("GLOBAL"),
  gameType: varchar("game_type", { length: 30 }),
  minVipLevel: varchar("min_vip_level", { length: 20 }),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => chatRooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  replyToId: varchar("reply_to_id"),
  replyToUsername: varchar("reply_to_username"),
  replyToContent: text("reply_to_content"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedBy: varchar("deleted_by"),
  deletedReason: text("deleted_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat Bans/Mutes
export const chatPenalties = pgTable("chat_penalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  roomId: varchar("room_id").references(() => chatRooms.id),
  penaltyType: varchar("penalty_type", { length: 20 }).notNull(),
  violationType: varchar("violation_type", { length: 30 }).notNull(),
  reason: text("reason"),
  messageContent: text("message_content"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  issuedBy: varchar("issued_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat Reports
export const chatReports = pgTable("chat_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => chatMessages.id),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  actionTaken: text("action_taken"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bad Words List
export const chatBadWords = pgTable("chat_bad_words", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  word: varchar("word", { length: 100 }).notNull().unique(),
  severity: integer("severity").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat Settings
export const chatSettings = pgTable("chat_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 50 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Chat Status (online tracking)
export const chatUserStatus = pgTable("chat_user_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  currentRoomId: varchar("current_room_id"),
  isOnline: boolean("is_online").default(false).notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
});

// User Chat Customization (level 50+ feature)
export const chatUserCustomization = pgTable("chat_user_customization", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  nameColor: varchar("name_color", { length: 20 }),
  nameEffect: varchar("name_effect", { length: 30 }),
  messageColor: varchar("message_color", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat User Blocks (user-to-user blocking)
export const chatUserBlocks = pgTable("chat_user_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockerId: varchar("blocker_id").notNull().references(() => users.id),
  blockedId: varchar("blocked_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Progressive Jackpot - Global Casino Jackpot
export const jackpotConfig = pgTable("jackpot_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).notNull().default("Global Jackpot"),
  currentAmount: numeric("current_amount", { precision: 15, scale: 2 }).default("1000.00").notNull(),
  minimumAmount: numeric("minimum_amount", { precision: 15, scale: 2 }).default("1000.00").notNull(),
  contributionRate: numeric("contribution_rate", { precision: 5, scale: 4 }).default("0.0020").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastWonAt: timestamp("last_won_at"),
  lastWonBy: varchar("last_won_by"),
  lastWonAmount: numeric("last_won_amount", { precision: 15, scale: 2 }),
  totalPaidOut: numeric("total_paid_out", { precision: 15, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jackpotWins = pgTable("jackpot_wins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  userName: varchar("user_name", { length: 100 }),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  gameType: varchar("game_type", { length: 50 }).notNull(),
  gameId: varchar("game_id"),
  betAmount: numeric("bet_amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jackpotContributions = pgTable("jackpot_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  betId: varchar("bet_id"),
  gameType: varchar("game_type", { length: 50 }).notNull(),
  betAmount: numeric("bet_amount", { precision: 15, scale: 2 }).notNull(),
  contribution: numeric("contribution", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Jackpot Types
export type JackpotConfig = typeof jackpotConfig.$inferSelect;
export type InsertJackpotConfig = typeof jackpotConfig.$inferInsert;
export type JackpotWin = typeof jackpotWins.$inferSelect;
export type InsertJackpotWin = typeof jackpotWins.$inferInsert;
export type JackpotContribution = typeof jackpotContributions.$inferSelect;
export type InsertJackpotContribution = typeof jackpotContributions.$inferInsert;

// Chat Moderator Roles
export const ChatModeratorRole = {
  NONE: "NONE",
  HELPER: "HELPER",
  CHAT_MODERATOR: "CHAT_MODERATOR",
  SUPPORT: "SUPPORT",
  ADMIN: "ADMIN",
} as const;

// Chat Types
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = typeof chatRooms.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type ChatPenalty = typeof chatPenalties.$inferSelect;
export type InsertChatPenalty = typeof chatPenalties.$inferInsert;
export type ChatReport = typeof chatReports.$inferSelect;
export type InsertChatReport = typeof chatReports.$inferInsert;
export type ChatBadWord = typeof chatBadWords.$inferSelect;
export type InsertChatBadWord = typeof chatBadWords.$inferInsert;
export type ChatSetting = typeof chatSettings.$inferSelect;
export type InsertChatSetting = typeof chatSettings.$inferInsert;
export type ChatUserStatus = typeof chatUserStatus.$inferSelect;
export type InsertChatUserStatus = typeof chatUserStatus.$inferInsert;
export type ChatUserCustomization = typeof chatUserCustomization.$inferSelect;
export type InsertChatUserCustomization = typeof chatUserCustomization.$inferInsert;
export type ChatUserBlock = typeof chatUserBlocks.$inferSelect;
export type InsertChatUserBlock = typeof chatUserBlocks.$inferInsert;

// Chat Validation Schemas
export const sendCommunityChatMessageSchema = z.object({
  roomId: z.string().uuid(),
  message: z.string().min(1).max(500),
});

export const reportMessageSchema = z.object({
  messageId: z.string().uuid(),
  reason: z.string().min(5).max(500),
});

export const createChatRoomSchema = z.object({
  name: z.string().min(2).max(50),
  displayName: z.string().min(2).max(100),
  type: z.enum(["GLOBAL", "GAME", "VIP"]),
  gameType: z.string().optional(),
  minVipLevel: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const addBadWordSchema = z.object({
  word: z.string().min(2).max(100),
  severity: z.number().int().min(1).max(5).optional(),
});

export const issuePenaltySchema = z.object({
  userId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  penaltyType: z.enum(["WARNING", "MUTE_5MIN", "MUTE_1HOUR", "BAN"]),
  reason: z.string().min(5).max(500),
});

export const updateChatSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});

// =============================================
// PROMOTIONAL CODES SYSTEM
// =============================================

export const PromoCodeType = {
  BONUS_FIXED: "BONUS_FIXED",
  BONUS_PERCENT: "BONUS_PERCENT",
  FREE_BET: "FREE_BET",
  CASHBACK: "CASHBACK",
} as const;

export const promoCodes = pgTable("promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull(),
  value: numeric("value", { precision: 15, scale: 2 }).notNull(),
  minDeposit: numeric("min_deposit", { precision: 15, scale: 2 }),
  maxUses: integer("max_uses"),
  maxUsesPerUser: integer("max_uses_per_user").default(1).notNull(),
  usesCount: integer("uses_count").default(0).notNull(),
  startsAt: timestamp("starts_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  rolloverMultiplier: numeric("rollover_multiplier", { precision: 5, scale: 2 }).default("1.00").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const promoCodeUses = pgTable("promo_code_uses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promoCodeId: varchar("promo_code_id").notNull().references(() => promoCodes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  depositId: varchar("deposit_id").references(() => pixDeposits.id),
  bonusAmount: numeric("bonus_amount", { precision: 15, scale: 2 }).notNull(),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;
export type PromoCodeUse = typeof promoCodeUses.$inferSelect;
export type InsertPromoCodeUse = typeof promoCodeUses.$inferInsert;

export const createPromoCodeSchema = z.object({
  code: z.string().min(3, "Código deve ter pelo menos 3 caracteres").max(50).transform(val => val.toUpperCase()),
  description: z.string().optional(),
  type: z.enum(["BONUS_FIXED", "BONUS_PERCENT", "FREE_BET", "CASHBACK"]),
  value: z.number().min(0.01, "Valor deve ser maior que 0"),
  minDeposit: z.number().min(0).optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  maxUsesPerUser: z.number().int().min(1).default(1),
  startsAt: z.string().or(z.date()),
  expiresAt: z.string().or(z.date()),
  rolloverMultiplier: z.number().min(1).default(1),
});

export const updatePromoCodeSchema = z.object({
  description: z.string().optional(),
  value: z.number().min(0.01).optional(),
  minDeposit: z.number().min(0).optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  maxUsesPerUser: z.number().int().min(1).optional(),
  startsAt: z.string().or(z.date()).optional(),
  expiresAt: z.string().or(z.date()).optional(),
  isActive: z.boolean().optional(),
  rolloverMultiplier: z.number().min(1).optional(),
});

export const applyPromoCodeSchema = z.object({
  code: z.string().min(1, "Código obrigatório").transform(val => val.toUpperCase()),
  depositAmount: z.number().min(0).optional(),
});

// =============================================
// DOUBLE GAME TYPES
// =============================================

export type DoubleBetType = "red" | "green" | "black" | "crown";

export interface DoubleBet {
  id: string;
  username: string;
  amount: number;
  type: DoubleBetType;
}

export interface DoubleRoundResult {
  id: number;
  type: DoubleBetType;
}

export interface DoubleGameStats {
  red: number;
  green: number;
  black: number;
  crown: number;
}

export interface DoubleGameState {
  balance: number;
  currentRound: number;
  previousRounds: DoubleRoundResult[];
  last100Stats: DoubleGameStats;
  bets: {
    red: DoubleBet[];
    green: DoubleBet[];
    black: DoubleBet[];
    crown: DoubleBet[];
  };
}

export type DoubleGamePhase = "SHOWING_RESULT" | "BETTING" | "SPINNING";

export interface DoubleSpinState {
  isSpinning: boolean;
  pendingResult: DoubleBetType | null;
  stopIndex: number | null;
  spinStartTime: number | null;
  spinId: string | null;
  spinDuration: number;
  lastResult: DoubleBetType | null;
  lastStopIndex: number | null;
  gamePhase: DoubleGamePhase;
  phaseEndTime: number | null;
  bettingTimeRemaining: number;
  canBet: boolean;
  serverSeedHash: string | null;
  previousServerSeed: string | null;
  previousClientSeed: string | null;
  previousNonce: number | null;
}

export const doubleInsertBetSchema = z.object({
  type: z.enum(["red", "green", "black", "crown"]),
  amount: z.number().min(0.01),
  username: z.string().optional(),
});

// =============================================
// AVIATOR MANIA GAME TABLES
// =============================================

export const aviatorRounds = pgTable("aviator_rounds", {
  id: serial("id").primaryKey(),
  crashPoint: numeric("crash_point", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("waiting").notNull(),
  serverSeed: text("server_seed"),
  serverSeedHash: text("server_seed_hash").notNull(),
  clientSeed: text("client_seed").notNull(),
  nonce: integer("nonce").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  crashedAt: timestamp("crashed_at"),
});

export const aviatorBets = pgTable("aviator_bets", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull().references(() => aviatorRounds.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  betAmount: numeric("bet_amount", { precision: 15, scale: 2 }).notNull(),
  cashoutMultiplier: numeric("cashout_multiplier", { precision: 10, scale: 2 }),
  autoCashoutAt: numeric("auto_cashout_at", { precision: 10, scale: 2 }),
  profit: numeric("profit", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  cashedOutAt: timestamp("cashed_out_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AviatorRound = typeof aviatorRounds.$inferSelect;
export type InsertAviatorRound = typeof aviatorRounds.$inferInsert;
export type AviatorBet = typeof aviatorBets.$inferSelect;
export type InsertAviatorBet = typeof aviatorBets.$inferInsert;

export const aviatorBetSchema = z.object({
  amount: z.number().min(0.10, "Aposta minima R$ 0,10"),
});
