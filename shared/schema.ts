import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
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

// Refresh tokens for JWT
export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
