import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users, AdminRole } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  getAllSettings,
  isAutoWithdrawGlobalEnabled,
  setAutoWithdrawGlobal,
} from "./settings.service";
import { z } from "zod";

const router = Router();

const adminOrSecurityCheck = async (req: Request, res: Response, next: Function) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return res.status(401).json({ error: "Usuário não encontrado" });
  }

  if (!user.isAdmin && user.adminRole !== AdminRole.ADMIN && user.adminRole !== AdminRole.SECURITY) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  (req as any).adminUser = user;
  next();
};

router.get("/", authMiddleware, adminOrSecurityCheck, async (req: Request, res: Response) => {
  try {
    const allSettings = await getAllSettings();
    res.json({ settings: allSettings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Erro ao buscar configurações" });
  }
});

router.get("/auto-withdraw", authMiddleware, adminOrSecurityCheck, async (req: Request, res: Response) => {
  try {
    const enabled = await isAutoWithdrawGlobalEnabled();
    res.json({ enabled });
  } catch (error) {
    console.error("Error fetching auto-withdraw setting:", error);
    res.status(500).json({ error: "Erro ao buscar configuração" });
  }
});

const updateAutoWithdrawSchema = z.object({
  enabled: z.boolean(),
});

router.put("/auto-withdraw", authMiddleware, adminOrSecurityCheck, async (req: Request, res: Response) => {
  try {
    const parsed = updateAutoWithdrawSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const adminUser = (req as any).adminUser;
    await setAutoWithdrawGlobal(parsed.data.enabled, adminUser.id);

    res.json({ 
      success: true, 
      message: parsed.data.enabled 
        ? "Saque PIX automático habilitado globalmente" 
        : "Saque PIX automático desabilitado globalmente"
    });
  } catch (error) {
    console.error("Error updating auto-withdraw setting:", error);
    res.status(500).json({ error: "Erro ao atualizar configuração" });
  }
});

export default router;
