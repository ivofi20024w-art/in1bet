import { Router, Request, Response } from "express";
import { storage } from "../../storage";
import { authMiddleware } from "../auth/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/wallet - Get user wallet
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const wallet = await storage.getWalletByUserId(req.user.id);
    if (!wallet) {
      res.status(404).json({ error: "Carteira não encontrada" });
      return;
    }

    res.json({
      wallet: {
        id: wallet.id,
        balance: parseFloat(wallet.balance),
        lockedBalance: parseFloat(wallet.lockedBalance),
        currency: wallet.currency,
        totalBalance: parseFloat(wallet.balance) + parseFloat(wallet.lockedBalance),
      },
    });
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/wallet/balance - Get just balance info
router.get("/balance", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const wallet = await storage.getWalletByUserId(req.user.id);
    if (!wallet) {
      res.status(404).json({ error: "Carteira não encontrada" });
      return;
    }

    res.json({
      balance: parseFloat(wallet.balance),
      lockedBalance: parseFloat(wallet.lockedBalance),
      currency: wallet.currency,
    });
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
