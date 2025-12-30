import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { requestWithdrawalSchema } from "@shared/schema";
import {
  requestWithdrawal,
  getUserWithdrawals,
  getWithdrawalById,
} from "./withdrawal.service";
import { withdrawalLimiter } from "../../middleware/rateLimit";

const router = Router();

router.post("/request", authMiddleware, withdrawalLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = requestWithdrawalSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.errors[0]?.message || "Dados inválidos",
      });
    }

    const { amount, pixKey, pixKeyType } = validation.data;

    const result = await requestWithdrawal(userId, amount, pixKey, pixKeyType);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "Saque solicitado com sucesso",
      withdrawal: {
        id: result.withdrawal!.id,
        amount: parseFloat(result.withdrawal!.amount),
        pixKey: result.withdrawal!.pixKey,
        pixKeyType: result.withdrawal!.pixKeyType,
        status: result.withdrawal!.status,
        createdAt: result.withdrawal!.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Withdrawal request error:", error);
    res.status(500).json({ error: "Erro ao solicitar saque" });
  }
});

router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const withdrawals = await getUserWithdrawals(userId, limit);

    res.json({
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: parseFloat(w.amount),
        pixKey: w.pixKey,
        pixKeyType: w.pixKeyType,
        status: w.status,
        rejectionReason: w.rejectionReason,
        createdAt: w.createdAt,
        paidAt: w.paidAt,
      })),
    });
  } catch (error: any) {
    console.error("Withdrawal history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico de saques" });
  }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const withdrawal = await getWithdrawalById(id, userId);

    if (!withdrawal) {
      return res.status(404).json({ error: "Saque não encontrado" });
    }

    res.json({
      withdrawal: {
        id: withdrawal.id,
        amount: parseFloat(withdrawal.amount),
        pixKey: withdrawal.pixKey,
        pixKeyType: withdrawal.pixKeyType,
        status: withdrawal.status,
        rejectionReason: withdrawal.rejectionReason,
        createdAt: withdrawal.createdAt,
        approvedAt: withdrawal.approvedAt,
        paidAt: withdrawal.paidAt,
      },
    });
  } catch (error: any) {
    console.error("Get withdrawal error:", error);
    res.status(500).json({ error: "Erro ao buscar saque" });
  }
});

export default router;
