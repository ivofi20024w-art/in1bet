import { Router, Request, Response } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as DoubleService from "./double.service";
import type { DoubleBetType } from "@shared/schema";

const router = Router();

router.get("/game", optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const state = DoubleService.getGameState(userId);
    res.json(state);
  } catch (error) {
    console.error("[DOUBLE] Error getting game state:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/state", optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const state = DoubleService.getGameState(userId);
    res.json({ game: state, activeBets: [] });
  } catch (error) {
    console.error("[DOUBLE] Error getting state:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/history", async (req: Request, res: Response) => {
  try {
    const history = DoubleService.getHistory();
    res.json({ history });
  } catch (error) {
    console.error("[DOUBLE] Error getting history:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/bet", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const [user] = await db.select().from(users).where(eq(users.id, userId!));
    const username = user?.name || "Anonymous";
    
    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const { amount, type, clientSeed } = req.body;
    const betAmount = typeof amount === "number" ? amount : parseFloat(amount);
    const color = type as DoubleBetType;
    
    if (isNaN(betAmount) || betAmount <= 0) {
      return res.status(400).json({ error: "Valor da aposta inválido" });
    }
    
    if (!["red", "green", "black", "crown"].includes(color)) {
      return res.status(400).json({ error: "Cor inválida" });
    }
    
    const result = await DoubleService.placeBet(userId, username, betAmount, color, clientSeed);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ success: true, bet: result.bet });
  } catch (error) {
    console.error("[DOUBLE] Error placing bet:", error);
    res.status(500).json({ error: "Erro ao apostar" });
  }
});

router.get("/config", (req: Request, res: Response) => {
  res.json({
    wheelSize: 99,
    spinDuration: 5000,
    roundInterval: 15000,
    multipliers: {
      red: 2,
      green: 7,
      black: 2,
      crown: 14
    },
    odds: {
      red: 0.45,
      green: 0.05,
      black: 0.45,
      crown: 0.05
    },
    betLimits: {
      min: 0.01,
      max: 10000
    }
  });
});

export default router;
