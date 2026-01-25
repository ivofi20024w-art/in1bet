import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { z } from "zod";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as PlinkoService from "./plinko.service";

const router = Router();

const playSchema = z.object({
  betAmount: z.number().min(1, "Aposta mínima é R$ 1,00").max(10000, "Aposta máxima é R$ 10.000,00"),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  rows: z.union([z.literal(8), z.literal(12), z.literal(16)]),
  clientSeed: z.string().optional(),
});

router.get("/multipliers", async (req: Request, res: Response) => {
  try {
    const risk = (req.query.risk as string || "MEDIUM") as PlinkoService.PlinkoRisk;
    const rows = parseInt(req.query.rows as string || "12") as PlinkoService.PlinkoRows;
    
    if (!["LOW", "MEDIUM", "HIGH"].includes(risk)) {
      return res.status(400).json({ error: "Risco inválido" });
    }
    
    if (![8, 12, 16].includes(rows)) {
      return res.status(400).json({ error: "Linhas inválidas" });
    }
    
    const multipliers = PlinkoService.getMultipliers(risk, rows);
    res.json({ multipliers, risk, rows });
  } catch (error) {
    console.error("[PLINKO] Error getting multipliers:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/history", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const bets = PlinkoService.getRecentBets(limit);
    res.json({ history: bets });
  } catch (error) {
    console.error("[PLINKO] Error getting history:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/play", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const username = user?.name || "Anonymous";
    
    const parsed = playSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0]?.message || "Dados inválidos",
      });
    }
    
    const { betAmount, risk, rows, clientSeed } = parsed.data;
    
    const result = await PlinkoService.playPlinko(userId, username, betAmount, risk, rows, clientSeed);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ success: true, bet: result.bet });
  } catch (error) {
    console.error("[PLINKO] Error playing:", error);
    res.status(500).json({ error: "Erro ao jogar" });
  }
});

export default router;
