import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users, claimRakebackSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  getUserRakebackSummary,
  getUserRakebackHistory,
  claimPendingRakeback,
  getRakebackSettings,
  getAdminRakebackStats,
  calculateWeeklyRakeback,
} from "./rakeback.service";

const router = Router();

const adminCheck = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({ error: "Erro ao verificar permissões" });
  }
};

router.get("/summary", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const summary = await getUserRakebackSummary(userId);
    res.json(summary);
  } catch (error: any) {
    console.error("Rakeback summary error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar resumo de rakeback" });
  }
});

router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await getUserRakebackHistory(userId, limit);
    res.json({ history });
  } catch (error: any) {
    console.error("Rakeback history error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar histórico de rakeback" });
  }
});

router.post("/claim", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = claimRakebackSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
    }
    
    const result = await claimPendingRakeback(userId, validation.data.payoutId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error: any) {
    console.error("Rakeback claim error:", error);
    res.status(500).json({ error: error.message || "Erro ao resgatar rakeback" });
  }
});

router.get("/settings", authMiddleware, async (req: Request, res: Response) => {
  try {
    const settings = await getRakebackSettings();
    res.json({ settings });
  } catch (error: any) {
    console.error("Rakeback settings error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar configurações" });
  }
});

router.get("/admin/stats", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const stats = await getAdminRakebackStats();
    res.json(stats);
  } catch (error: any) {
    console.error("Admin rakeback stats error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar estatísticas" });
  }
});

router.post("/admin/calculate-weekly", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const result = await calculateWeeklyRakeback();
    res.json(result);
  } catch (error: any) {
    console.error("Admin rakeback calculation error:", error);
    res.status(500).json({ error: error.message || "Erro ao calcular rakeback" });
  }
});

export default router;
