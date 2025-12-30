import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { z } from "zod";
import * as CrashService from "./crash.service";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

const placeBetSchema = z.object({
  betAmount: z.number().min(1, "Aposta mínima é R$ 1,00").max(10000, "Aposta máxima é R$ 10.000,00"),
  autoCashout: z.number().min(1.01).optional(),
  clientSeed: z.string().optional(),
});

const cashoutSchema = z.object({
  betId: z.string().uuid(),
});

router.get("/state", authMiddleware, async (req: Request, res: Response) => {
  try {
    const game = CrashService.getCurrentGame();
    const userId = (req as any).user.id;
    const activeBet = await CrashService.getActiveUserBet(userId);
    
    res.json({ 
      game,
      activeBet,
    });
  } catch (error: any) {
    console.error("Get crash state error:", error);
    res.status(500).json({ error: "Erro ao buscar estado do jogo" });
  }
});

router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const history = await CrashService.getRecentGames(limit);
    
    res.json({ history });
  } catch (error: any) {
    console.error("Get crash history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

router.post("/bet", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const parsed = placeBetSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        error: parsed.error.errors[0].message 
      });
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const username = user?.name || "Anônimo";
    
    const result = await CrashService.placeBet({
      userId,
      username,
      ...parsed.data,
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ bet: result.bet });
  } catch (error: any) {
    console.error("Place crash bet error:", error);
    res.status(500).json({ error: "Erro ao fazer aposta" });
  }
});

router.post("/cashout", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const parsed = cashoutSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        error: parsed.error.errors[0].message 
      });
    }
    
    const result = await CrashService.cashout({
      userId,
      betId: parsed.data.betId,
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ 
      multiplier: result.multiplier,
      winAmount: result.winAmount,
    });
  } catch (error: any) {
    console.error("Crash cashout error:", error);
    res.status(500).json({ error: "Erro ao fazer cashout" });
  }
});

export default router;
