import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Payments module structure - PIX integration will be added later

// POST /api/payments/deposit - Initiate deposit (placeholder)
router.post("/deposit", async (req: Request, res: Response) => {
  res.status(501).json({ 
    error: "Funcionalidade de depósito em desenvolvimento",
    message: "PIX integration coming soon" 
  });
});

// POST /api/payments/withdraw - Initiate withdrawal (placeholder)
router.post("/withdraw", async (req: Request, res: Response) => {
  res.status(501).json({ 
    error: "Funcionalidade de saque em desenvolvimento",
    message: "PIX integration coming soon" 
  });
});

// GET /api/payments/history - Get transaction history (placeholder)
router.get("/history", async (req: Request, res: Response) => {
  res.status(501).json({ 
    error: "Funcionalidade em desenvolvimento",
    message: "Transaction history coming soon" 
  });
});

export default router;
