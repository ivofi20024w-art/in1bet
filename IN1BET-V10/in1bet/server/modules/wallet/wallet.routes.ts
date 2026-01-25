import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { 
  getWalletBalance, 
  getWallet, 
  getTransactionHistory,
  getTransaction
} from "./wallet.service";
import { TransactionType } from "@shared/schema";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/wallet - Get user wallet with full details
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const wallet = await getWallet(req.user.id);
    if (!wallet) {
      res.status(404).json({ error: "Carteira não encontrada" });
      return;
    }

    const balance = parseFloat(wallet.balance);
    const lockedBalance = parseFloat(wallet.lockedBalance);
    const bonusBalance = parseFloat(wallet.bonusBalance);
    const rolloverRemaining = parseFloat(wallet.rolloverRemaining);
    const rolloverTotal = parseFloat(wallet.rolloverTotal);
    const rolloverProgress = rolloverTotal > 0
      ? Math.round(((rolloverTotal - rolloverRemaining) / rolloverTotal) * 100)
      : 100;

    res.json({
      wallet: {
        id: wallet.id,
        balance,
        lockedBalance,
        bonusBalance,
        totalBalance: balance + bonusBalance,
        rolloverRemaining,
        rolloverTotal,
        rolloverProgress,
        currency: wallet.currency,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/wallet/balance - Get just balance info (lightweight)
router.get("/balance", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const balance = await getWalletBalance(req.user.id);
    if (!balance) {
      res.status(404).json({ error: "Carteira não encontrada" });
      return;
    }

    res.json(balance);
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/wallet/transactions - Get transaction history
router.get("/transactions", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string | undefined;

    // Validate transaction type if provided
    if (type && !Object.values(TransactionType).includes(type as any)) {
      res.status(400).json({ error: "Tipo de transação inválido" });
      return;
    }

    const transactions = await getTransactionHistory(
      req.user.id,
      limit,
      offset,
      type as any
    );

    res.json({
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        balanceBefore: parseFloat(tx.balanceBefore),
        balanceAfter: parseFloat(tx.balanceAfter),
        status: tx.status,
        description: tx.description,
        referenceId: tx.referenceId,
        createdAt: tx.createdAt,
      })),
      pagination: {
        limit,
        offset,
        hasMore: transactions.length === limit,
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/wallet/transactions/:id - Get single transaction detail
router.get("/transactions/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const transaction = await getTransaction(req.params.id, req.user.id);
    
    if (!transaction) {
      res.status(404).json({ error: "Transação não encontrada" });
      return;
    }

    res.json({
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        balanceBefore: parseFloat(transaction.balanceBefore),
        balanceAfter: parseFloat(transaction.balanceAfter),
        status: transaction.status,
        description: transaction.description,
        referenceId: transaction.referenceId,
        metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
