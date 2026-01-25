import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users, claimMissionSchema, createMissionTemplateSchema, claimStreakRewardSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  getUserMissions,
  claimMissionReward,
  getMissionStats,
  getAdminMissionTemplates,
  createMissionTemplate,
  updateMissionTemplate,
  deleteMissionTemplate,
  searchUserMissions,
  forceCompleteMission,
  getAdminMissionStats,
  initializeMissionTemplates,
} from "./mission.service";
import {
  getUserStreak,
  getStreakRewards,
  claimStreakReward,
  useStreakProtection,
  initializeStreakRewards,
} from "./streak.service";

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

router.get("/active", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const missions = await getUserMissions(userId);
    res.json(missions);
  } catch (error: any) {
    console.error("Get missions error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar missões" });
  }
});

router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await getMissionStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error("Get mission stats error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar estatísticas" });
  }
});

router.post("/claim", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = claimMissionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
    }
    
    const result = await claimMissionReward(userId, validation.data.assignmentId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error: any) {
    console.error("Claim mission error:", error);
    res.status(500).json({ error: error.message || "Erro ao resgatar recompensa" });
  }
});

router.get("/admin/templates", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const templates = await getAdminMissionTemplates();
    res.json({ templates });
  } catch (error: any) {
    console.error("Admin get templates error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar templates" });
  }
});

router.post("/admin/templates", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = createMissionTemplateSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
    }
    
    const template = await createMissionTemplate(validation.data);
    res.json(template);
  } catch (error: any) {
    console.error("Admin create template error:", error);
    res.status(500).json({ error: error.message || "Erro ao criar template" });
  }
});

router.put("/admin/templates/:id", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await updateMissionTemplate(id, req.body);
    res.json(template);
  } catch (error: any) {
    console.error("Admin update template error:", error);
    res.status(500).json({ error: error.message || "Erro ao atualizar template" });
  }
});

router.post("/admin/initialize", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    await initializeMissionTemplates();
    await initializeStreakRewards();
    res.json({ success: true });
  } catch (error: any) {
    console.error("Admin initialize error:", error);
    res.status(500).json({ error: error.message || "Erro ao inicializar" });
  }
});

router.delete("/admin/templates/:id", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteMissionTemplate(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Admin delete template error:", error);
    res.status(500).json({ error: error.message || "Erro ao deletar template" });
  }
});

router.get("/admin/user-missions", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    if (!search || typeof search !== "string") {
      return res.status(400).json({ error: "Parâmetro de busca necessário" });
    }
    const results = await searchUserMissions(search);
    res.json({ results });
  } catch (error: any) {
    console.error("Admin search user missions error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar missões de usuário" });
  }
});

router.post("/admin/force-complete/:assignmentId", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const adminId = req.user!.id;
    const result = await forceCompleteMission(assignmentId, adminId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Admin force complete error:", error);
    res.status(500).json({ error: error.message || "Erro ao completar missão" });
  }
});

router.get("/admin/stats", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const stats = await getAdminMissionStats();
    res.json(stats);
  } catch (error: any) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar estatísticas" });
  }
});

// =============================================
// STREAK ROUTES
// =============================================

router.get("/streak", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const streakData = await getUserStreak(userId);
    res.json({
      success: true,
      data: {
        currentStreak: streakData.streak.currentStreak,
        longestStreak: streakData.streak.longestStreak,
        lastCompletionDate: streakData.streak.lastCompletionDate,
        streakProtections: streakData.streak.streakProtections,
        totalMissionsCompleted: streakData.streak.totalMissionsCompleted,
        availableRewards: streakData.availableRewards.map((r) => ({
          streakDay: r.streakDay,
          rewardType: r.rewardType,
          rewardValue: parseFloat(r.rewardValue),
        })),
        claimedDays: streakData.claimedDays,
      },
    });
  } catch (error: any) {
    console.error("Get streak error:", error);
    res.status(500).json({ success: false, error: error.message || "Erro ao buscar streak" });
  }
});

router.get("/streak/rewards", authMiddleware, async (req: Request, res: Response) => {
  try {
    const rewards = await getStreakRewards();
    res.json({
      success: true,
      data: rewards.map((r) => ({
        streakDay: r.streakDay,
        rewardType: r.rewardType,
        rewardValue: parseFloat(r.rewardValue),
        isActive: r.isActive,
      })),
    });
  } catch (error: any) {
    console.error("Get streak rewards error:", error);
    res.status(500).json({ success: false, error: error.message || "Erro ao buscar recompensas" });
  }
});

router.post("/streak/claim", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = claimStreakRewardSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error.errors[0]?.message || "Dados inválidos" 
      });
    }

    const result = await claimStreakReward(userId, validation.data.streakDay);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result.reward });
  } catch (error: any) {
    console.error("Claim streak reward error:", error);
    res.status(500).json({ success: false, error: error.message || "Erro ao resgatar recompensa" });
  }
});

router.post("/streak/protect", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await useStreakProtection(userId);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: { remainingProtections: result.remainingProtections },
    });
  } catch (error: any) {
    console.error("Use streak protection error:", error);
    res.status(500).json({ success: false, error: error.message || "Erro ao usar proteção" });
  }
});

export default router;
