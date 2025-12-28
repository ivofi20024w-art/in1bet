import { db } from "../../db";
import { 
  wallets, 
  transactions, 
  TransactionType, 
  TransactionStatus,
  type Wallet,
  type Transaction,
  type TransactionTypeValue,
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface TransactionResult {
  success: boolean;
  transaction?: Transaction;
  wallet?: Wallet;
  error?: string;
}

export interface WalletBalance {
  balance: number;
  lockedBalance: number;
  totalBalance: number;
  currency: string;
}

// Get wallet balance for a user
export async function getWalletBalance(userId: string): Promise<WalletBalance | null> {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  
  if (!wallet) return null;
  
  const balance = parseFloat(wallet.balance);
  const lockedBalance = parseFloat(wallet.lockedBalance);
  
  return {
    balance,
    lockedBalance,
    totalBalance: balance + lockedBalance,
    currency: wallet.currency,
  };
}

// Get wallet by user ID
export async function getWallet(userId: string): Promise<Wallet | null> {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  return wallet || null;
}

// Process a balance change with transaction ledger (atomic operation)
export async function processBalanceChange(
  userId: string,
  amount: number,
  type: TransactionTypeValue,
  description?: string,
  referenceId?: string,
  metadata?: Record<string, any>
): Promise<TransactionResult> {
  // Validate amount
  if (amount <= 0) {
    return { success: false, error: "O valor deve ser maior que zero" };
  }

  // Generate unique reference ID if not provided (for idempotency)
  const txReferenceId = referenceId || `${type}_${userId}_${Date.now()}_${randomUUID().slice(0, 8)}`;

  // Check for existing transaction with same reference ID (idempotency)
  const [existingTx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.referenceId, txReferenceId));

  if (existingTx) {
    if (existingTx.status === TransactionStatus.COMPLETED) {
      return { 
        success: true, 
        transaction: existingTx,
        error: "Transação já processada"
      };
    }
    return { success: false, error: "Transação duplicada em processamento" };
  }

  // Get current wallet
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  
  if (!wallet) {
    return { success: false, error: "Carteira não encontrada" };
  }

  const currentBalance = parseFloat(wallet.balance);
  const currentLockedBalance = parseFloat(wallet.lockedBalance);
  
  // Calculate new balance based on transaction type
  let newBalance = currentBalance;
  let newLockedBalance = currentLockedBalance;
  
  switch (type) {
    case TransactionType.DEPOSIT:
    case TransactionType.WIN:
    case TransactionType.ROLLBACK:
      newBalance = currentBalance + amount;
      break;
      
    case TransactionType.WITHDRAW:
    case TransactionType.BET:
      if (currentBalance < amount) {
        return { success: false, error: "Saldo insuficiente" };
      }
      newBalance = currentBalance - amount;
      break;
      
    case TransactionType.WITHDRAW_RESERVE:
      if (currentBalance < amount) {
        return { success: false, error: "Saldo insuficiente" };
      }
      newBalance = currentBalance - amount;
      newLockedBalance = currentLockedBalance + amount;
      break;
      
    case TransactionType.WITHDRAW_RELEASE:
      if (currentLockedBalance < amount) {
        return { success: false, error: "Saldo bloqueado insuficiente" };
      }
      newBalance = currentBalance + amount;
      newLockedBalance = currentLockedBalance - amount;
      break;
      
    case TransactionType.BONUS:
      newLockedBalance = currentLockedBalance + amount;
      break;
      
    default:
      return { success: false, error: "Tipo de transação inválido" };
  }

  // Ensure balance never goes negative
  if (newBalance < 0 || newLockedBalance < 0) {
    return { success: false, error: "Operação resultaria em saldo negativo" };
  }

  try {
    // Use raw SQL transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // Lock the wallet row for update (prevents race conditions)
      const [lockedWallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .for("update");

      if (!lockedWallet) {
        throw new Error("Carteira não encontrada durante transação");
      }

      const actualBalance = parseFloat(lockedWallet.balance);
      const actualLockedBalance = parseFloat(lockedWallet.lockedBalance);

      // Recalculate with locked row values
      let finalBalance = actualBalance;
      let finalLockedBalance = actualLockedBalance;

      switch (type) {
        case TransactionType.DEPOSIT:
        case TransactionType.WIN:
        case TransactionType.ROLLBACK:
          finalBalance = actualBalance + amount;
          break;
        case TransactionType.WITHDRAW:
        case TransactionType.BET:
          if (actualBalance < amount) {
            throw new Error("Saldo insuficiente");
          }
          finalBalance = actualBalance - amount;
          break;
        case TransactionType.WITHDRAW_RESERVE:
          // Reserve balance for pending withdrawal (move from available to locked)
          if (actualBalance < amount) {
            throw new Error("Saldo insuficiente");
          }
          finalBalance = actualBalance - amount;
          finalLockedBalance = actualLockedBalance + amount;
          break;
        case TransactionType.WITHDRAW_RELEASE:
          // Release reserved balance back to available (withdrawal rejected)
          if (actualLockedBalance < amount) {
            throw new Error("Saldo bloqueado insuficiente");
          }
          finalBalance = actualBalance + amount;
          finalLockedBalance = actualLockedBalance - amount;
          break;
        case TransactionType.BONUS:
          finalLockedBalance = actualLockedBalance + amount;
          break;
      }

      if (finalBalance < 0 || finalLockedBalance < 0) {
        throw new Error("Operação resultaria em saldo negativo");
      }

      // Create transaction record
      const [newTransaction] = await tx
        .insert(transactions)
        .values({
          userId,
          walletId: lockedWallet.id,
          type,
          amount: amount.toFixed(2),
          balanceBefore: actualBalance.toFixed(2),
          balanceAfter: finalBalance.toFixed(2),
          status: TransactionStatus.COMPLETED,
          referenceId: txReferenceId,
          description: description || null,
          metadata: metadata ? JSON.stringify(metadata) : null,
        })
        .returning();

      // Update wallet balance
      const [updatedWallet] = await tx
        .update(wallets)
        .set({
          balance: finalBalance.toFixed(2),
          lockedBalance: finalLockedBalance.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userId))
        .returning();

      return { transaction: newTransaction, wallet: updatedWallet };
    });

    return {
      success: true,
      transaction: result.transaction,
      wallet: result.wallet,
    };
  } catch (error: any) {
    console.error("Transaction error:", error);
    return {
      success: false,
      error: error.message || "Erro ao processar transação",
    };
  }
}

// Get transaction history for a user
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  type?: TransactionTypeValue
): Promise<Transaction[]> {
  let query = db
    .select()
    .from(transactions)
    .where(
      type 
        ? and(eq(transactions.userId, userId), eq(transactions.type, type))
        : eq(transactions.userId, userId)
    )
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  return await query;
}

// Get transaction by ID
export async function getTransaction(
  transactionId: string,
  userId: string
): Promise<Transaction | null> {
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, userId)
      )
    );
  
  return transaction || null;
}

// Get transaction by reference ID (for idempotency checks)
export async function getTransactionByReference(
  referenceId: string
): Promise<Transaction | null> {
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.referenceId, referenceId));
  
  return transaction || null;
}

// Clear locked balance when withdrawal is paid (just removes from locked, doesn't add anywhere)
export async function clearLockedBalance(
  userId: string,
  amount: number,
  referenceId: string,
  description?: string
): Promise<TransactionResult> {
  if (amount <= 0) {
    return { success: false, error: "O valor deve ser maior que zero" };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .for("update");

      if (!wallet) {
        throw new Error("Carteira não encontrada");
      }

      const lockedBalance = parseFloat(wallet.lockedBalance);
      
      if (lockedBalance < amount) {
        throw new Error("Saldo bloqueado insuficiente");
      }

      const newLockedBalance = lockedBalance - amount;

      // Create transaction record for the withdrawal completion
      const [newTransaction] = await tx
        .insert(transactions)
        .values({
          userId,
          walletId: wallet.id,
          type: TransactionType.WITHDRAW,
          amount: amount.toFixed(2),
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance,
          status: TransactionStatus.COMPLETED,
          referenceId,
          description: description || "Saque PIX pago",
          metadata: null,
        })
        .returning();

      // Update wallet - only reduce locked balance
      const [updatedWallet] = await tx
        .update(wallets)
        .set({
          lockedBalance: newLockedBalance.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userId))
        .returning();

      return { transaction: newTransaction, wallet: updatedWallet };
    });

    return {
      success: true,
      transaction: result.transaction,
      wallet: result.wallet,
    };
  } catch (error: any) {
    console.error("Clear locked balance error:", error);
    return {
      success: false,
      error: error.message || "Erro ao processar saque",
    };
  }
}
