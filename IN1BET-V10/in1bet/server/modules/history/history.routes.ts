import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import * as HistoryService from "./history.service";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string | undefined;

    const result = await HistoryService.getUnifiedHistory(
      userId,
      limit,
      offset,
      { type: type as any }
    );

    res.json(result);
  } catch (error: any) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

router.get("/bets", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const gameType = req.query.gameType as string | undefined;
    const status = req.query.status as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
    const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;

    const result = await HistoryService.getBetHistory(
      userId,
      limit,
      offset,
      { gameType, status, startDate, endDate, minAmount, maxAmount }
    );

    res.json(result);
  } catch (error: any) {
    console.error("Get bet history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico de apostas" });
  }
});

router.get("/transactions", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string | undefined;

    const result = await HistoryService.getTransactionHistory(
      userId,
      limit,
      offset,
      type
    );

    res.json(result);
  } catch (error: any) {
    console.error("Get transaction history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico de transações" });
  }
});

router.get("/withdrawals", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await HistoryService.getWithdrawalHistory(
      userId,
      limit,
      offset
    );

    res.json(result);
  } catch (error: any) {
    console.error("Get withdrawal history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico de saques" });
  }
});

router.get("/deposits", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await HistoryService.getDepositHistory(
      userId,
      limit,
      offset
    );

    res.json(result);
  } catch (error: any) {
    console.error("Get deposit history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico de depósitos" });
  }
});

router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const stats = await HistoryService.getUserStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

router.get("/winners", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const winners = await HistoryService.getRecentWinners(limit);
    res.json({ success: true, data: winners });
  } catch (error: any) {
    console.error("Get winners error:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar ganhadores" });
  }
});

export default router;
