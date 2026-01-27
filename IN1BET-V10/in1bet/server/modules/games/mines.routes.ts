import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { z } from "zod";
import * as MinesService from "./mines.service";

const router = Router();

const startGameSchema = z.object({
  betAmount: z.number().min(1, "Aposta mínima é R$ 1,00").max(10000, "Aposta máxima é R$ 10.000,00"),
  mineCount: z.number().int().min(1).max(24),
  clientSeed: z.string().optional(),
});

const revealTileSchema = z.object({
  betId: z.string().uuid(),
  tileIndex: z.number().int().min(0).max(24),
});

const cashoutSchema = z.object({
  betId: z.string().uuid(),
});

router.post("/start", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const parsed = startGameSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        error: parsed.error.errors[0].message 
      });
    }

    const result = await MinesService.startMinesGame({
      userId,
      ...parsed.data,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ game: result.game });
  } catch (error: any) {
    console.error("Start mines game error:", error);
    res.status(500).json({ error: "Erro ao iniciar jogo" });
  }
});

router.post("/reveal", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const parsed = revealTileSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        error: parsed.error.errors[0].message 
      });
    }

    const result = await MinesService.revealTile({
      userId,
      ...parsed.data,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ game: result.game });
  } catch (error: any) {
    console.error("Reveal tile error:", error);
    res.status(500).json({ error: "Erro ao revelar campo" });
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

    const result = await MinesService.cashout({
      userId,
      betId: parsed.data.betId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      winAmount: result.winAmount,
      multiplier: result.multiplier || 1,
      minePositions: result.minePositions,
    });
  } catch (error: any) {
    console.error("Cashout error:", error);
    res.status(500).json({ error: "Erro ao sacar" });
  }
});

router.get("/active", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await MinesService.getActiveGame(userId);

    if (!result.game) {
      return res.json({ active: false });
    }

    res.json({ 
      active: true, 
      game: result.game,
      betAmount: result.betAmount,
    });
  } catch (error: any) {
    console.error("Get active game error:", error);
    res.status(500).json({ error: "Erro ao buscar jogo ativo" });
  }
});

export default router;
