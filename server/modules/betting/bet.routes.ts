import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { placeBetSchema } from "@shared/schema";
import * as BetService from "./bet.service";

const router = Router();

router.get("/balance", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const balances = await BetService.getAvailableBalance(userId);
    const canBet = await BetService.canUserBet(userId);
    
    res.json({
      ...balances,
      canBet: canBet.canBet,
      reason: canBet.reason,
    });
  } catch (error: any) {
    console.error("Get balance error:", error);
    res.status(500).json({ error: "Erro ao buscar saldo" });
  }
});

router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const gameType = req.query.gameType as string | undefined;
    
    const bets = await BetService.getUserBets(
      userId, 
      limit, 
      offset, 
      gameType as any
    );
    
    res.json({ bets, limit, offset });
  } catch (error: any) {
    console.error("Get bet history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

router.get("/:betId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { betId } = req.params;
    
    const bet = await BetService.getBetById(betId, userId);
    
    if (!bet) {
      return res.status(404).json({ error: "Aposta não encontrada" });
    }
    
    res.json({ bet });
  } catch (error: any) {
    console.error("Get bet error:", error);
    res.status(500).json({ error: "Erro ao buscar aposta" });
  }
});

export default router;
