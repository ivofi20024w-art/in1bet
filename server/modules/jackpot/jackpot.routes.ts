import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { getJackpotInfo, updateJackpotSettings, getJackpotStats } from "./jackpot.service";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

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

router.get("/info", async (_req: Request, res: Response) => {
  try {
    const info = await getJackpotInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    console.error("[JACKPOT] Error fetching info:", error);
    res.status(500).json({ error: "Erro ao buscar informações do jackpot" });
  }
});

router.get("/admin/stats", authMiddleware, adminCheck, async (_req: Request, res: Response) => {
  try {
    const stats = await getJackpotStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("[JACKPOT] Error fetching stats:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas do jackpot" });
  }
});

router.put("/admin/settings", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { minimumAmount, contributionRate, isActive } = req.body;
    
    if (minimumAmount !== undefined && (typeof minimumAmount !== "number" || minimumAmount < 100)) {
      res.status(400).json({ error: "Valor mínimo deve ser pelo menos R$100" });
      return;
    }
    
    if (contributionRate !== undefined && (typeof contributionRate !== "number" || contributionRate < 0.001 || contributionRate > 0.1)) {
      res.status(400).json({ error: "Taxa de contribuição deve estar entre 0.1% e 10%" });
      return;
    }
    
    const updated = await updateJackpotSettings({
      minimumAmount,
      contributionRate,
      isActive,
    });
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("[JACKPOT] Error updating settings:", error);
    res.status(500).json({ error: "Erro ao atualizar configurações" });
  }
});

export default router;
