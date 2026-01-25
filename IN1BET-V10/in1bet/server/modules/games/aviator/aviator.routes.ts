import { Router, Request, Response } from "express";
import { db } from "../../../db";
import { aviatorRounds, aviatorBets, wallets, transactions } from "../../../../shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { verifyCrashPoint } from "./aviator.engine";
import { authMiddleware } from "../../auth/auth.middleware";
import crypto from "crypto";
import { addXpFromWager } from "../../levels/level.service";

const router = Router();

let aviatorEngine: any = null;

export function setAviatorEngine(engine: any) {
  aviatorEngine = engine;
}

router.post("/bet", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const userId = req.user!.id;
    
    if (!amount || amount < 0.10) {
      return res.status(400).json({ message: "Aposta minima R$ 0,10" });
    }

    if (!aviatorEngine) {
      return res.status(500).json({ message: "Game engine not initialized" });
    }

    const status = aviatorEngine.getGameStatus();
    if (status !== "waiting") {
      return res.status(400).json({ message: "Apostas fechadas para esta rodada" });
    }

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    if (!wallet) {
      return res.status(400).json({ message: "Carteira nao encontrada" });
    }

    const availableBalance = parseFloat(wallet.balance);
    if (availableBalance < amount) {
      return res.status(400).json({ message: "Saldo insuficiente" });
    }

    const roundId = aviatorEngine.getCurrentRoundId();
    
    let targetRoundId = roundId;
    if (!targetRoundId) {
      const [latestRound] = await db
        .select()
        .from(aviatorRounds)
        .orderBy(desc(aviatorRounds.id))
        .limit(1);
      
      if (latestRound && latestRound.status !== "crashed") {
        targetRoundId = latestRound.id;
      } else {
        return res.status(400).json({ message: "Nenhuma rodada ativa" });
      }
    }

    const newBalance = (availableBalance - amount).toFixed(2);
    await db
      .update(wallets)
      .set({ balance: newBalance })
      .where(eq(wallets.userId, userId));

    const [bet] = await db.insert(aviatorBets).values({
      roundId: targetRoundId,
      userId,
      betAmount: amount.toFixed(2),
      status: "pending",
    }).returning();

    await db.insert(transactions).values({
      userId,
      walletId: wallet.id,
      type: "BET",
      amount: (-amount).toFixed(2),
      balanceBefore: availableBalance.toFixed(2),
      balanceAfter: newBalance,
      description: `Aposta Aviator Mania - Rodada #${targetRoundId}`,
      status: "COMPLETED",
    });

    try {
      await addXpFromWager(userId, amount);
    } catch (err) {
      console.error(`[AVIATOR] Failed to add XP for user ${userId}:`, err);
    }

    res.json({ 
      bet, 
      newBalance,
      message: "Aposta realizada com sucesso"
    });
  } catch (error) {
    console.error("Aviator bet error:", error);
    res.status(500).json({ message: "Falha ao realizar aposta" });
  }
});

router.post("/cashout", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { betId } = req.body;
    const userId = req.user!.id;
    
    if (!betId) {
      return res.status(400).json({ message: "ID da aposta obrigatorio" });
    }

    if (!aviatorEngine) {
      return res.status(500).json({ message: "Game engine not initialized" });
    }

    const status = aviatorEngine.getGameStatus();
    if (status !== "running") {
      return res.status(400).json({ message: "Saque nao permitido neste momento" });
    }

    const [bet] = await db
      .select()
      .from(aviatorBets)
      .where(and(
        eq(aviatorBets.id, betId),
        eq(aviatorBets.userId, userId)
      ));

    if (!bet) {
      return res.status(404).json({ message: "Aposta nao encontrada" });
    }

    if (bet.status !== "active") {
      return res.status(400).json({ message: "Aposta nao esta ativa" });
    }

    const currentMultiplier = aviatorEngine.getCurrentMultiplier();
    const betAmount = parseFloat(bet.betAmount);
    const winAmount = betAmount * currentMultiplier;
    const profit = winAmount - betAmount;

    await db
      .update(aviatorBets)
      .set({
        cashoutMultiplier: currentMultiplier.toFixed(2),
        profit: profit.toFixed(2),
        status: "won",
        cashedOutAt: new Date(),
      })
      .where(eq(aviatorBets.id, betId));

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    const oldBalance = parseFloat(wallet.balance);
    const newBalance = (oldBalance + winAmount).toFixed(2);
    await db
      .update(wallets)
      .set({ balance: newBalance })
      .where(eq(wallets.userId, userId));

    await db.insert(transactions).values({
      userId,
      walletId: wallet.id,
      type: "WIN",
      amount: winAmount.toFixed(2),
      balanceBefore: oldBalance.toFixed(2),
      balanceAfter: newBalance,
      description: `Ganho Aviator Mania ${currentMultiplier.toFixed(2)}x`,
      status: "COMPLETED",
    });

    res.json({ 
      success: true, 
      profit: profit.toFixed(2), 
      multiplier: currentMultiplier.toFixed(2),
      winAmount: winAmount.toFixed(2),
      newBalance 
    });
  } catch (error) {
    console.error("Aviator cashout error:", error);
    res.status(500).json({ message: "Falha ao sacar" });
  }
});

router.get("/status", async (req: Request, res: Response) => {
  try {
    if (!aviatorEngine) {
      return res.json({ status: "waiting", roundId: null });
    }
    
    const status = aviatorEngine.getGameStatus();
    const roundId = aviatorEngine.getCurrentRoundId();
    const multiplier = aviatorEngine.getCurrentMultiplier();
    
    res.json({ status, roundId, multiplier });
  } catch (error) {
    res.status(500).json({ message: "Falha ao obter status" });
  }
});

router.get("/history", async (req: Request, res: Response) => {
  try {
    const rounds = await db
      .select()
      .from(aviatorRounds)
      .where(eq(aviatorRounds.status, "crashed"))
      .orderBy(desc(aviatorRounds.id))
      .limit(20);
    
    const safeRounds = rounds.map(round => ({
      id: round.id,
      crashPoint: parseFloat(round.crashPoint),
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
      crashedAt: round.crashedAt,
    }));
    
    res.json(safeRounds);
  } catch (error) {
    res.status(500).json({ message: "Falha ao obter historico" });
  }
});

router.get("/my-bets", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const bets = await db
      .select()
      .from(aviatorBets)
      .where(eq(aviatorBets.userId, userId))
      .orderBy(desc(aviatorBets.createdAt))
      .limit(50);
    
    res.json(bets);
  } catch (error) {
    res.status(500).json({ message: "Falha ao obter apostas" });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { roundId, serverSeed, clientSeed, nonce } = req.body;
    
    if (roundId) {
      const [round] = await db
        .select()
        .from(aviatorRounds)
        .where(eq(aviatorRounds.id, parseInt(roundId)));
      
      if (!round) {
        return res.status(404).json({ message: "Rodada nao encontrada" });
      }
      
      if (round.status !== "crashed" || !round.serverSeed) {
        return res.status(400).json({ message: "Rodada ainda nao finalizou" });
      }
      
      const computedHash = crypto.createHash("sha256").update(round.serverSeed).digest("hex");
      const hashMatches = computedHash === round.serverSeedHash;
      
      const calculatedCrashPoint = verifyCrashPoint(round.serverSeed, round.clientSeed, round.nonce);
      const storedCrashPoint = parseFloat(round.crashPoint);
      const crashPointMatches = Math.abs(calculatedCrashPoint - storedCrashPoint) < 0.01;
      
      return res.json({
        verified: hashMatches && crashPointMatches,
        roundId: round.id,
        hashVerified: hashMatches,
        crashPointVerified: crashPointMatches,
        storedCrashPoint,
        calculatedCrashPoint: parseFloat(calculatedCrashPoint.toFixed(2)),
        serverSeed: round.serverSeed,
        serverSeedHash: round.serverSeedHash,
        clientSeed: round.clientSeed,
        nonce: round.nonce,
      });
    }
    
    if (!serverSeed || !clientSeed || nonce === undefined) {
      return res.status(400).json({ 
        message: "Forneca roundId OU (serverSeed, clientSeed, nonce)" 
      });
    }

    const calculatedCrashPoint = verifyCrashPoint(serverSeed, clientSeed, nonce);
    
    res.json({
      verified: true,
      crashPoint: parseFloat(calculatedCrashPoint.toFixed(2)),
      serverSeed,
      clientSeed,
      nonce,
    });
  } catch (error) {
    res.status(500).json({ message: "Falha ao verificar" });
  }
});

router.get("/top-wins", async (req: Request, res: Response) => {
  try {
    const wins = await db
      .select()
      .from(aviatorBets)
      .where(eq(aviatorBets.status, "won"))
      .orderBy(desc(aviatorBets.profit))
      .limit(10);
    
    res.json(wins);
  } catch (error) {
    res.status(500).json({ message: "Falha ao obter maiores ganhos" });
  }
});

export default router;
