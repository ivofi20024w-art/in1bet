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
  isBlocked: boolean("is_blocked").default(false),
  blockReason: text("block_reason"),
  blockedAt: timestamp("blocked_at"),
  blockedBy: varchar("blocked_by"),
  kycStatus: varchar("kyc_status", { length: 20 }).default("pending"),
  vipLevel: varchar("vip_level", { length: 20 }).default("bronze"),
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

// Admin Audit Log Actions
export const AdminAction = {
  USER_BLOCK: "USER_BLOCK",
  USER_UNBLOCK: "USER_UNBLOCK",
  WITHDRAWAL_APPROVE: "WITHDRAWAL_APPROVE",
  WITHDRAWAL_REJECT: "WITHDRAWAL_REJECT",
  WITHDRAWAL_PAY: "WITHDRAWAL_PAY",
  BONUS_CREATE: "BONUS_CREATE",
  BONUS_UPDATE: "BONUS_UPDATE",
  BONUS_TOGGLE: "BONUS_TOGGLE",
  USER_BONUS_CANCEL: "USER_BONUS_CANCEL",
  USER_MAKE_ADMIN: "USER_MAKE_ADMIN",
  USER_REMOVE_ADMIN: "USER_REMOVE_ADMIN",
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

// Safe user type (without password)
export type SafeUser = Omit<User, 'password'>;
