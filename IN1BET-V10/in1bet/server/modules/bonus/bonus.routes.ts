import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import {
  getActiveBonuses,
  getUserActiveBonuses,
  getUserBonusHistory,
  getWalletBonusInfo,
  checkRolloverForWithdrawal,
} from "./bonus.service";
import { db } from "../../db";
import { bonuses } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/available", async (req: Request, res: Response) => {
  try {
    const activeBonuses = await getActiveBonuses();
    
    res.json({
      bonuses: activeBonuses.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        type: b.type,
        percentage: parseFloat(b.percentage),
        maxValue: parseFloat(b.maxValue),
        rolloverMultiplier: parseFloat(b.rolloverMultiplier),
        minDeposit: parseFloat(b.minDeposit),
        isFirstDepositOnly: b.isFirstDepositOnly,
      })),
    });
  } catch (error: any) {
    console.error("Get available bonuses error:", error);
    res.status(500).json({ error: "Erro ao buscar bônus disponíveis" });
  }
});

router.get("/my-bonuses", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const activeBonuses = await getUserActiveBonuses(userId);
    
    const bonusesWithDetails = [];
    for (const ub of activeBonuses) {
      const [bonus] = await db.select().from(bonuses).where(eq(bonuses.id, ub.bonusId));
      bonusesWithDetails.push({
        id: ub.id,
        bonusName: bonus?.name || "Bônus",
        bonusAmount: parseFloat(ub.bonusAmount),
        rolloverTotal: parseFloat(ub.rolloverTotal),
        rolloverRemaining: parseFloat(ub.rolloverRemaining),
        rolloverProgress: parseFloat(ub.rolloverTotal) > 0
          ? Math.round(((parseFloat(ub.rolloverTotal) - parseFloat(ub.rolloverRemaining)) / parseFloat(ub.rolloverTotal)) * 100)
          : 100,
        status: ub.status,
        expiresAt: ub.expiresAt,
        createdAt: ub.createdAt,
      });
    }

    res.json({ bonuses: bonusesWithDetails });
  } catch (error: any) {
    console.error("Get my bonuses error:", error);
    res.status(500).json({ error: "Erro ao buscar seus bônus" });
  }
});

router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const history = await getUserBonusHistory(userId);
    
    const historyWithDetails = [];
    for (const ub of history) {
      const [bonus] = await db.select().from(bonuses).where(eq(bonuses.id, ub.bonusId));
      historyWithDetails.push({
        id: ub.id,
        bonusName: bonus?.name || "Bônus",
        bonusAmount: parseFloat(ub.bonusAmount),
        rolloverTotal: parseFloat(ub.rolloverTotal),
        rolloverRemaining: parseFloat(ub.rolloverRemaining),
        status: ub.status,
        expiresAt: ub.expiresAt,
        completedAt: ub.completedAt,
        createdAt: ub.createdAt,
      });
    }

    res.json({ history: historyWithDetails });
  } catch (error: any) {
    console.error("Get bonus history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico de bônus" });
  }
});

router.get("/wallet-info", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const info = await getWalletBonusInfo(userId);
    
    if (!info) {
      return res.status(404).json({ error: "Carteira não encontrada" });
    }

    res.json(info);
  } catch (error: any) {
    console.error("Get wallet bonus info error:", error);
    res.status(500).json({ error: "Erro ao buscar informações de bônus" });
  }
});

router.get("/withdrawal-check", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await checkRolloverForWithdrawal(userId);
    
    res.json(result);
  } catch (error: any) {
    console.error("Check withdrawal rollover error:", error);
    res.status(500).json({ error: "Erro ao verificar rollover" });
  }
});

export default router;
