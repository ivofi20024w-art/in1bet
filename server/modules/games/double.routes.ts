import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as DoubleService from "./double.service";

const router = Router();

router.get("/state", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const state = DoubleService.getGameState(userId);
    res.json(state);
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
    const userId = (req as any).user?.id;
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const username = user?.name || "Anonymous";
    
    if (!userId || !username) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const { betAmount, color, clientSeed } = req.body;
    
    if (typeof betAmount !== "number" || betAmount <= 0) {
      return res.status(400).json({ error: "Valor da aposta inválido" });
    }
    
    if (!["RED", "BLACK", "WHITE"].includes(color)) {
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

export default router;
