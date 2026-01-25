import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import {
  getUserLevelInfo,
  claimDailyBox,
  getLevelHistory,
  getDailyBoxHistory,
} from "./level.service";
import {
  getResponsibleGamingSettings,
  setDepositLimits,
  setBetLimit,
  setSessionTimeLimit,
  selfExclude,
  checkSessionTime,
  acknowledgeSessionAlert,
  getResponsibleGamingHistory,
  startSession,
} from "./responsible-gaming.service";
import {
  setDepositLimitSchema,
  setBetLimitSchema,
  setSessionLimitSchema,
  selfExcludeSchema,
} from "@shared/schema";

const router = Router();

router.get("/info", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const info = await getUserLevelInfo(userId);
    res.json(info);
  } catch (error: any) {
    console.error("Level info error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar informações de nível" });
  }
});

router.post("/daily-box/claim", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await claimDailyBox(userId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error: any) {
    console.error("Daily box claim error:", error);
    res.status(500).json({ error: error.message || "Erro ao resgatar caixa diária" });
  }
});

router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const [levelHistory, dailyBoxHistory] = await Promise.all([
      getLevelHistory(userId),
      getDailyBoxHistory(userId),
    ]);
    
    res.json({ levelHistory, dailyBoxHistory });
  } catch (error: any) {
    console.error("Level history error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar histórico" });
  }
});

router.get("/responsible-gaming", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const settings = await getResponsibleGamingSettings(userId);
    res.json(settings);
  } catch (error: any) {
    console.error("Responsible gaming settings error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar configurações" });
  }
});

router.post("/responsible-gaming/deposit-limits", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = setDepositLimitSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
    }
    
    const result = await setDepositLimits(userId, validation.data);
    res.json(result);
  } catch (error: any) {
    console.error("Set deposit limits error:", error);
    res.status(500).json({ error: error.message || "Erro ao definir limites" });
  }
});

router.post("/responsible-gaming/bet-limit", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = setBetLimitSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
    }
    
    const result = await setBetLimit(userId, validation.data.maxBetLimit);
    res.json(result);
  } catch (error: any) {
    console.error("Set bet limit error:", error);
    res.status(500).json({ error: error.message || "Erro ao definir limite de aposta" });
  }
});

router.post("/responsible-gaming/session-limit", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = setSessionLimitSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
    }
    
    const result = await setSessionTimeLimit(userId, validation.data.sessionTimeLimit);
    res.json(result);
  } catch (error: any) {
    console.error("Set session limit error:", error);
    res.status(500).json({ error: error.message || "Erro ao definir limite de sessão" });
  }
});

router.post("/responsible-gaming/self-exclude", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = selfExcludeSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
    }
    
    const result = await selfExclude(userId, validation.data.duration, validation.data.reason);
    res.json(result);
  } catch (error: any) {
    console.error("Self exclude error:", error);
    res.status(500).json({ error: error.message || "Erro ao aplicar autoexclusão" });
  }
});

router.get("/responsible-gaming/session-check", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await checkSessionTime(userId);
    res.json(result);
  } catch (error: any) {
    console.error("Session check error:", error);
    res.status(500).json({ error: error.message || "Erro ao verificar sessão" });
  }
});

router.post("/responsible-gaming/session-start", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await startSession(userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Session start error:", error);
    res.status(500).json({ error: error.message || "Erro ao iniciar sessão" });
  }
});

router.post("/responsible-gaming/acknowledge-alert/:alertId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { alertId } = req.params;
    await acknowledgeSessionAlert(alertId, userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Acknowledge alert error:", error);
    res.status(500).json({ error: error.message || "Erro ao reconhecer alerta" });
  }
});

router.get("/responsible-gaming/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const history = await getResponsibleGamingHistory(userId);
    res.json({ history });
  } catch (error: any) {
    console.error("Responsible gaming history error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar histórico" });
  }
});

export default router;
