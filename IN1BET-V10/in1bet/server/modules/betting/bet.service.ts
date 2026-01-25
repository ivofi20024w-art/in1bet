import { db } from "../../db";
import {
  bets,
  wallets,
  transactions,
  BetStatus,
  TransactionType,
  TransactionStatus,
  GameType,
} from "@shared/schema";

type Bet = typeof bets.$inferSelect;
type BetStatusValue = (typeof BetStatus)[keyof typeof BetStatus];
type GameTypeValue = (typeof GameType)[keyof typeof GameType];
import { eq, and, sql, desc } from "drizzle-orm";
import { createHash, randomBytes, randomUUID } from "crypto";
import { logOperational } from "../../utils/operationalLog";
import { contributeToJackpot } from "../jackpot/jackpot.service";
import { updateMissionProgress } from "../missions/mission.service";

export interface PlaceBetRequest {
  userId: string;
  gameType: GameTypeValue;
  betAmount: number;
  gamePayload?: Record<string, any>;
  clientSeed?: string;
}

export interface BetResult {
  success: boolean;
  bet?: Bet;
  error?: string;
}

export interface SettleBetRequest {
  betId: string;
  userId: string;
  won: boolean;
  multiplier: number;
  gameResult: Record<string, any>;
}

function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

function hashServerSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

export async function canUserBet(userId: string): Promise<{ canBet: boolean; reason?: string }> {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  
  if (!wallet) {
    return { canBet: false, reason: "Carteira não encontrada" };
  }

  const rolloverRemaining = parseFloat(wallet.rolloverRemaining || "0");
  if (rolloverRemaining > 0) {
    return { canBet: true };
  }

  return { canBet: true };
}

export async function getAvailableBalance(userId: string): Promise<{ balance: number; bonusBalance: number }> {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  
  if (!wallet) {
    return { balance: 0, bonusBalance: 0 };
  }

  return {
    balance: parseFloat(wallet.balance),
    bonusBalance: parseFloat(wallet.bonusBalance),
  };
}

export async function placeBet(request: PlaceBetRequest): Promise<BetResult> {
  const { userId, gameType, betAmount, gamePayload, clientSeed } = request;

  if (betAmount <= 0) {
    return { success: false, error: "Valor da aposta deve ser maior que zero" };
  }

  if (betAmount > 10000) {
    return { success: false, error: "Aposta máxima é R$ 10.000,00" };
  }

  const betCheck = await canUserBet(userId);
  if (!betCheck.canBet) {
    return { success: false, error: betCheck.reason };
  }

  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  const betReferenceId = `BET_RESERVE_${userId}_${Date.now()}_${randomUUID().slice(0, 8)}`;

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

      const balance = parseFloat(wallet.balance);
      const bonusBalance = parseFloat(wallet.bonusBalance);
      const rolloverRemaining = parseFloat(wallet.rolloverRemaining || "0");

      let useBonus = false;
      let finalBalance = balance;
      let finalBonusBalance = bonusBalance;
      let finalRolloverRemaining = rolloverRemaining;

      if (rolloverRemaining > 0 && bonusBalance >= betAmount) {
        useBonus = true;
        finalBonusBalance = bonusBalance - betAmount;
        finalRolloverRemaining = Math.max(0, rolloverRemaining - betAmount);
      } else if (balance >= betAmount) {
        finalBalance = balance - betAmount;
      } else if (balance + bonusBalance >= betAmount) {
        const fromReal = balance;
        const fromBonus = betAmount - fromReal;
        finalBalance = 0;
        finalBonusBalance = bonusBalance - fromBonus;
        if (rolloverRemaining > 0) {
          finalRolloverRemaining = Math.max(0, rolloverRemaining - fromBonus);
        }
        useBonus = fromBonus > 0;
      } else {
        throw new Error("Saldo insuficiente");
      }

      const [reserveTransaction] = await tx
        .insert(transactions)
        .values({
          userId,
          walletId: wallet.id,
          type: TransactionType.BET,
          amount: betAmount.toFixed(2),
          balanceBefore: balance.toFixed(2),
          balanceAfter: finalBalance.toFixed(2),
          status: TransactionStatus.COMPLETED,
          referenceId: betReferenceId,
          description: `Aposta ${gameType}`,
          metadata: JSON.stringify({ gameType, useBonus }),
        })
        .returning();

      await tx
        .update(wallets)
        .set({
          balance: finalBalance.toFixed(2),
          bonusBalance: finalBonusBalance.toFixed(2),
          rolloverRemaining: finalRolloverRemaining.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userId));

      const nonce = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(bets)
        .where(eq(bets.userId, userId));

      const [newBet] = await tx
        .insert(bets)
        .values({
          userId,
          gameType,
          betAmount: betAmount.toFixed(2),
          status: BetStatus.ACTIVE,
          serverSeed,
          clientSeed: clientSeed || randomBytes(16).toString("hex"),
          nonce: (nonce[0]?.count || 0).toString(),
          serverSeedHash,
          gamePayload: gamePayload ? JSON.stringify(gamePayload) : null,
          reserveTransactionId: reserveTransaction.id,
          usedBonusBalance: useBonus,
        })
        .returning();

      return newBet;
    });

    logOperational({
      type: "BET_PLACED",
      severity: "INFO",
      message: `Bet placed: ${result.id} - ${gameType} - R$${betAmount}`,
      entityType: "bet",
      entityId: result.id,
      userId,
      metadata: { gameType, betAmount },
    });

    try {
      const jackpotResult = await contributeToJackpot(userId, betAmount, gameType, result.id);
      if (jackpotResult.won) {
        console.log(`[JACKPOT] User ${userId} won R$${jackpotResult.wonAmount} on ${gameType}!`);
      }
    } catch (jackpotError) {
      console.error("[JACKPOT] Error contributing to jackpot:", jackpotError);
    }

    try {
      await updateMissionProgress(userId, "BET_COUNT", 1, result.id);
      await updateMissionProgress(userId, "BET_AMOUNT", betAmount, result.id);
    } catch (missionError) {
      console.error("[MISSIONS] Error updating mission progress:", missionError);
    }

    return { success: true, bet: result };
  } catch (error: any) {
    console.error("Place bet error:", error);
    return {
      success: false,
      error: error.message || "Erro ao processar aposta",
    };
  }
}

export async function settleBet(request: SettleBetRequest): Promise<BetResult> {
  const { betId, userId, won, multiplier, gameResult } = request;

  const settleReferenceId = `BET_SETTLE_${betId}`;
  
  const [existingTx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.referenceId, settleReferenceId));
  
  if (existingTx) {
    const [existingBet] = await db
      .select()
      .from(bets)
      .where(eq(bets.id, betId));
    return { success: true, bet: existingBet, error: "Aposta já foi finalizada" };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [bet] = await tx
        .select()
        .from(bets)
        .where(and(eq(bets.id, betId), eq(bets.userId, userId)))
        .for("update");

      if (!bet) {
        throw new Error("Aposta não encontrada");
      }

      if (bet.status !== BetStatus.ACTIVE) {
        return bet;
      }

      const betAmount = parseFloat(bet.betAmount);
      const winAmount = won ? betAmount * multiplier : 0;
      const profit = won ? winAmount - betAmount : -betAmount;

      const newStatus = won ? BetStatus.WON : BetStatus.LOST;

      let settleTransactionId: string | null = null;

      if (won && winAmount > 0) {
        const [wallet] = await tx
          .select()
          .from(wallets)
          .where(eq(wallets.userId, userId))
          .for("update");

        if (!wallet) {
          throw new Error("Carteira não encontrada");
        }

        const currentBalance = parseFloat(wallet.balance);
        const newBalance = currentBalance + winAmount;

        const [settleTransaction] = await tx
          .insert(transactions)
          .values({
            userId,
            walletId: wallet.id,
            type: TransactionType.WIN,
            amount: winAmount.toFixed(2),
            balanceBefore: currentBalance.toFixed(2),
            balanceAfter: newBalance.toFixed(2),
            status: TransactionStatus.COMPLETED,
            referenceId: settleReferenceId,
            description: `Ganho ${bet.gameType} - ${multiplier}x`,
            metadata: JSON.stringify({ betId, multiplier }),
          })
          .returning();

        settleTransactionId = settleTransaction.id;

        await tx
          .update(wallets)
          .set({
            balance: newBalance.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(wallets.userId, userId));
      }

      const [updatedBet] = await tx
        .update(bets)
        .set({
          status: newStatus,
          winAmount: winAmount.toFixed(2),
          profit: profit.toFixed(2),
          multiplier: multiplier.toFixed(4),
          gameResult: JSON.stringify(gameResult),
          settleTransactionId,
          settledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(bets.id, betId), eq(bets.status, BetStatus.ACTIVE)))
        .returning();

      if (!updatedBet) {
        throw new Error("Aposta já foi finalizada");
      }

      return updatedBet;
    });

    logOperational({
      type: won ? "BET_WON" : "BET_LOST",
      severity: "INFO",
      message: `Bet settled: ${betId} - ${won ? "WON" : "LOST"} - ${multiplier}x`,
      entityType: "bet",
      entityId: betId,
      userId,
      metadata: { won, multiplier, winAmount: won ? parseFloat(result.winAmount) : 0 },
    });

    if (won) {
      try {
        const winAmount = parseFloat(result.winAmount);
        await updateMissionProgress(userId, "WIN_COUNT", 1, betId);
        await updateMissionProgress(userId, "WIN_AMOUNT", winAmount, betId);
      } catch (missionError) {
        console.error("[MISSIONS] Error updating win mission progress:", missionError);
      }
    }

    return { success: true, bet: result };
  } catch (error: any) {
    console.error("Settle bet error:", error);
    return {
      success: false,
      error: error.message || "Erro ao finalizar aposta",
    };
  }
}

export async function cancelBet(betId: string, userId: string, reason: string): Promise<BetResult> {
  try {
    const result = await db.transaction(async (tx) => {
      const [bet] = await tx
        .select()
        .from(bets)
        .where(and(eq(bets.id, betId), eq(bets.userId, userId)))
        .for("update");

      if (!bet) {
        throw new Error("Aposta não encontrada");
      }

      if (bet.status !== BetStatus.ACTIVE && bet.status !== BetStatus.PENDING) {
        throw new Error("Aposta não pode ser cancelada");
      }

      const betAmount = parseFloat(bet.betAmount);

      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .for("update");

      if (!wallet) {
        throw new Error("Carteira não encontrada");
      }

      const currentBalance = parseFloat(wallet.balance);
      const currentBonusBalance = parseFloat(wallet.bonusBalance);
      const currentRollover = parseFloat(wallet.rolloverRemaining || "0");

      let newBalance = currentBalance;
      let newBonusBalance = currentBonusBalance;
      let newRollover = currentRollover;

      if (bet.usedBonusBalance) {
        newBonusBalance = currentBonusBalance + betAmount;
        newRollover = currentRollover + betAmount;
      } else {
        newBalance = currentBalance + betAmount;
      }

      const refundReferenceId = `BET_CANCEL_${betId}_${Date.now()}`;

      await tx
        .insert(transactions)
        .values({
          userId,
          walletId: wallet.id,
          type: TransactionType.ROLLBACK,
          amount: betAmount.toFixed(2),
          balanceBefore: currentBalance.toFixed(2),
          balanceAfter: newBalance.toFixed(2),
          status: TransactionStatus.COMPLETED,
          referenceId: refundReferenceId,
          description: `Cancelamento aposta - ${reason}`,
          metadata: JSON.stringify({ betId, reason }),
        });

      await tx
        .update(wallets)
        .set({
          balance: newBalance.toFixed(2),
          bonusBalance: newBonusBalance.toFixed(2),
          rolloverRemaining: newRollover.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userId));

      const [updatedBet] = await tx
        .update(bets)
        .set({
          status: BetStatus.CANCELLED,
          gameResult: JSON.stringify({ cancelled: true, reason }),
          settledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(bets.id, betId))
        .returning();

      return updatedBet;
    });

    logOperational({
      type: "BET_CANCELLED",
      severity: "WARN",
      message: `Bet cancelled: ${betId} - ${reason}`,
      entityType: "bet",
      entityId: betId,
      userId,
      metadata: { reason },
    });

    return { success: true, bet: result };
  } catch (error: any) {
    console.error("Cancel bet error:", error);
    return {
      success: false,
      error: error.message || "Erro ao cancelar aposta",
    };
  }
}

export async function getBetById(betId: string, userId: string): Promise<Bet | null> {
  const [bet] = await db
    .select()
    .from(bets)
    .where(and(eq(bets.id, betId), eq(bets.userId, userId)));
  return bet || null;
}

export async function getUserBets(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  gameType?: GameTypeValue
): Promise<Bet[]> {
  let query = db
    .select()
    .from(bets)
    .where(
      gameType
        ? and(eq(bets.userId, userId), eq(bets.gameType, gameType))
        : eq(bets.userId, userId)
    )
    .orderBy(desc(bets.createdAt))
    .limit(limit)
    .offset(offset);

  return await query;
}

export async function getActiveBet(userId: string, gameType: GameTypeValue): Promise<Bet | null> {
  const [bet] = await db
    .select()
    .from(bets)
    .where(
      and(
        eq(bets.userId, userId),
        eq(bets.gameType, gameType),
        eq(bets.status, BetStatus.ACTIVE)
      )
    );
  return bet || null;
}
