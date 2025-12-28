import { Router, Request, Response } from "express";
import { storage, sanitizeUser } from "../../storage";
import { authMiddleware } from "../auth/auth.middleware";

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

    const { name, phone } = req.body;
    
    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

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

export default router;
