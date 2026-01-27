import { Router, Request, Response } from "express";
import { storage, sanitizeUser } from "../../storage";
import { authMiddleware } from "../auth/auth.middleware";
import { changeUserPassword } from "../auth/auth.service";
import { db } from "../../db";
import { userSettings, updateUserSettingsSchema, changePasswordSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/users/profile - Get current user profile
router.get("/profile", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// PATCH /api/users/profile - Update user profile
router.patch("/profile", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const { name, phone, avatarUrl } = req.body;
    
    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    
    if (avatarUrl !== undefined) {
      if (avatarUrl === null || avatarUrl === "") {
        updateData.avatarUrl = null;
      } else if (avatarUrl.startsWith("/avatars/")) {
        updateData.avatarUrl = avatarUrl;
      } else {
        res.status(400).json({ error: "Avatar inválido. Selecione um dos avatares disponíveis." });
        return;
      }
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "Nenhum dado para atualizar" });
      return;
    }

    const updatedUser = await storage.updateUser(req.user.id, updateData);
    if (!updatedUser) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    res.json({ 
      message: "Perfil atualizado com sucesso",
      user: sanitizeUser(updatedUser) 
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/users/kyc-status - Get KYC verification status
router.get("/kyc-status", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    res.json({
      kycStatus: req.user.kycStatus,
      isVerified: req.user.isVerified,
    });
  } catch (error) {
    console.error("Get KYC status error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/users/change-password - Change user password
router.post("/change-password", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const validationResult = changePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ 
        error: validationResult.error.errors[0]?.message || "Dados inválidos" 
      });
      return;
    }

    const { currentPassword, newPassword } = validationResult.data;

    const result = await changeUserPassword(req.user.id, currentPassword, newPassword);
    
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ message: "Senha alterada com sucesso! Você será desconectado de todos os dispositivos." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/users/settings - Get user settings
router.get("/settings", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, req.user.id));

    if (!settings) {
      res.json({
        settings: {
          language: "pt-BR",
          oddsFormat: "decimal",
          emailMarketing: false,
          pushNotifications: true,
          smsNotifications: true,
        }
      });
      return;
    }

    res.json({
      settings: {
        language: settings.language,
        oddsFormat: settings.oddsFormat,
        emailMarketing: settings.emailMarketing,
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
      }
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/users/settings - Update user settings
router.post("/settings", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const validationResult = updateUserSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ 
        error: validationResult.error.errors[0]?.message || "Dados inválidos" 
      });
      return;
    }

    const updateData = validationResult.data;

    const [existingSettings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, req.user.id));

    let settings;
    if (existingSettings) {
      [settings] = await db
        .update(userSettings)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(userSettings.userId, req.user.id))
        .returning();
    } else {
      [settings] = await db
        .insert(userSettings)
        .values({
          userId: req.user.id,
          ...updateData,
        })
        .returning();
    }

    res.json({ 
      message: "Configurações salvas com sucesso",
      settings: {
        language: settings.language,
        oddsFormat: settings.oddsFormat,
        emailMarketing: settings.emailMarketing,
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
      }
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
