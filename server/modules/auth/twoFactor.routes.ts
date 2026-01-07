import { Router, type Request, type Response } from "express";
import { authMiddleware } from "./auth.middleware";
import {
  generateTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorToken,
  regenerateBackupCodes,
  getTwoFactorStatus,
} from "./twoFactor.service";

const router = Router();

router.get("/status", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const status = await getTwoFactorStatus(userId);
    res.json(status);
  } catch (error) {
    console.error("Error getting 2FA status:", error);
    res.status(500).json({ error: "Erro ao verificar status do 2FA" });
  }
});

router.post("/setup", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;
    const setup = await generateTwoFactorSetup(userId, email);
    res.json({
      secret: setup.secret,
      qrCode: setup.qrCodeDataUrl,
      backupCodes: setup.backupCodes,
    });
  } catch (error) {
    console.error("Error generating 2FA setup:", error);
    res.status(500).json({ error: "Erro ao gerar configuração do 2FA" });
  }
});

router.post("/enable", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { secret, token, backupCodes } = req.body;

    if (!secret || !token || !backupCodes || !Array.isArray(backupCodes)) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const result = await enableTwoFactor(userId, secret, token, backupCodes);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: "2FA ativado com sucesso" });
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    res.status(500).json({ error: "Erro ao ativar 2FA" });
  }
});

router.post("/disable", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Código é obrigatório" });
    }

    const result = await disableTwoFactor(userId, token);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: "2FA desativado com sucesso" });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    res.status(500).json({ error: "Erro ao desativar 2FA" });
  }
});

router.post("/verify", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Código é obrigatório" });
    }

    const result = await verifyTwoFactorToken(userId, token);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ 
      success: true, 
      usedBackupCode: result.usedBackupCode || false 
    });
  } catch (error) {
    console.error("Error verifying 2FA:", error);
    res.status(500).json({ error: "Erro ao verificar código 2FA" });
  }
});

router.post("/regenerate-backup-codes", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Código é obrigatório" });
    }

    const result = await regenerateBackupCodes(userId, token);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ 
      success: true, 
      backupCodes: result.backupCodes 
    });
  } catch (error) {
    console.error("Error regenerating backup codes:", error);
    res.status(500).json({ error: "Erro ao regenerar códigos de backup" });
  }
});

export default router;
