import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users, claimMissionSchema, createMissionTemplateSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  getUserMissions,
  claimMissionReward,
  getMissionStats,
  getAdminMissionTemplates,
  createMissionTemplate,
  updateMissionTemplate,
  initializeMissionTemplates,
} from "./mission.service";

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
    res.json({ success: true });
  } catch (error: any) {
    console.error("Admin initialize error:", error);
    res.status(500).json({ error: error.message || "Erro ao inicializar" });
  }
});

export default router;
