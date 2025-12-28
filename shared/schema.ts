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
  lockedBalance: numeric("locked_balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
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
} as const;

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
  lockedBalance: true,
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

// Types
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

// Safe user type (without password)
export type SafeUser = Omit<User, 'password'>;
