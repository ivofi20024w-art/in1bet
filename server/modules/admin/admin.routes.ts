import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users, wallets, pixWithdrawals, transactions, bonuses, userBonuses } from "@shared/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import {
  getAllPendingWithdrawals,
  getAllWithdrawals,
  getWithdrawalById,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalAsPaid,
} from "../withdrawals/withdrawal.service";
import {
  getAllBonuses,
  createBonus,
  updateBonus,
  toggleBonusStatus,
  cancelUserBonus,
} from "../bonus/bonus.service";

const router = Router();

router.use(authMiddleware);

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

router.get("/stats", adminCheck, async (req: Request, res: Response) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [withdrawalCount] = await db
      .select({ count: count() })
      .from(pixWithdrawals)
      .where(eq(pixWithdrawals.status, "PENDING"));

    res.json({
      totalUsers: userCount?.count || 0,
      pendingWithdrawals: withdrawalCount?.count || 0,
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

router.get("/users", adminCheck, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const usersList = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    const usersWithWallets = [];
    for (const user of usersList) {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id));
      usersWithWallets.push({
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        kycStatus: user.kycStatus,
        vipLevel: user.vipLevel,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        balance: wallet ? parseFloat(wallet.balance) : 0,
        lockedBalance: wallet ? parseFloat(wallet.lockedBalance) : 0,
      });
    }

    res.json({ users: usersWithWallets });
  } catch (error: any) {
    console.error("Admin users error:", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

router.get("/withdrawals", adminCheck, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    let withdrawals;
    if (status === "PENDING") {
      withdrawals = await getAllPendingWithdrawals();
    } else {
      withdrawals = await getAllWithdrawals(limit);
    }

    res.json({
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: parseFloat(w.amount),
        pixKey: w.pixKey,
        pixKeyType: w.pixKeyType,
        status: w.status,
        rejectionReason: w.rejectionReason,
        createdAt: w.createdAt,
        approvedAt: w.approvedAt,
        paidAt: w.paidAt,
        user: {
          id: w.user.id,
          name: w.user.name,
          email: w.user.email,
          cpf: w.user.cpf,
        },
      })),
    });
  } catch (error: any) {
    console.error("Admin withdrawals error:", error);
    res.status(500).json({ error: "Erro ao buscar saques" });
  }
});

router.get("/withdrawals/:id", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const withdrawal = await getWithdrawalById(id);

    if (!withdrawal) {
      return res.status(404).json({ error: "Saque não encontrado" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, withdrawal.userId));
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, withdrawal.userId));

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
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        kycStatus: user.kycStatus,
      } : null,
      wallet: wallet ? {
        balance: parseFloat(wallet.balance),
        lockedBalance: parseFloat(wallet.lockedBalance),
      } : null,
    });
  } catch (error: any) {
    console.error("Admin get withdrawal error:", error);
    res.status(500).json({ error: "Erro ao buscar saque" });
  }
});

router.post("/withdrawals/:id/approve", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const result = await approveWithdrawal(id, adminId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "Saque aprovado com sucesso",
      withdrawal: result.withdrawal,
    });
  } catch (error: any) {
    console.error("Admin approve withdrawal error:", error);
    res.status(500).json({ error: "Erro ao aprovar saque" });
  }
});

router.post("/withdrawals/:id/reject", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "Motivo da rejeição é obrigatório" });
    }

    const result = await rejectWithdrawal(id, adminId, reason);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "Saque rejeitado",
      withdrawal: result.withdrawal,
    });
  } catch (error: any) {
    console.error("Admin reject withdrawal error:", error);
    res.status(500).json({ error: "Erro ao rejeitar saque" });
  }
});

router.post("/withdrawals/:id/pay", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const result = await markWithdrawalAsPaid(id, adminId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "Saque marcado como pago",
      withdrawal: result.withdrawal,
    });
  } catch (error: any) {
    console.error("Admin pay withdrawal error:", error);
    res.status(500).json({ error: "Erro ao marcar saque como pago" });
  }
});

router.get("/bonuses", adminCheck, async (req: Request, res: Response) => {
  try {
    const allBonuses = await getAllBonuses();
    
    res.json({
      bonuses: allBonuses.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        type: b.type,
        percentage: parseFloat(b.percentage),
        maxValue: parseFloat(b.maxValue),
        fixedAmount: parseFloat(b.fixedAmount),
        maxWithdrawal: parseFloat(b.maxWithdrawal),
        rolloverMultiplier: parseFloat(b.rolloverMultiplier),
        minDeposit: parseFloat(b.minDeposit),
        isActive: b.isActive,
        isFirstDepositOnly: b.isFirstDepositOnly,
        validDays: parseInt(b.validDays),
        createdAt: b.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Admin get bonuses error:", error);
    res.status(500).json({ error: "Erro ao buscar bônus" });
  }
});

router.post("/bonuses", adminCheck, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    const result = await createBonus({
      name: data.name,
      description: data.description,
      type: data.type,
      percentage: data.percentage,
      maxValue: data.maxValue,
      rolloverMultiplier: data.rolloverMultiplier,
      minDeposit: data.minDeposit,
      isFirstDepositOnly: data.isFirstDepositOnly,
      validDays: data.validDays,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, bonus: result.bonus });
  } catch (error: any) {
    console.error("Admin create bonus error:", error);
    res.status(500).json({ error: "Erro ao criar bônus" });
  }
});

router.put("/bonuses/:id", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await updateBonus(id, data);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, bonus: result.bonus });
  } catch (error: any) {
    console.error("Admin update bonus error:", error);
    res.status(500).json({ error: "Erro ao atualizar bônus" });
  }
});

router.post("/bonuses/:id/toggle", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await toggleBonusStatus(id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ 
      success: true, 
      bonus: result.bonus,
      message: result.bonus?.isActive ? "Bônus ativado" : "Bônus desativado",
    });
  } catch (error: any) {
    console.error("Admin toggle bonus error:", error);
    res.status(500).json({ error: "Erro ao alterar status do bônus" });
  }
});

router.get("/user-bonuses", adminCheck, async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    let userBonusesList;
    if (userId) {
      userBonusesList = await db
        .select()
        .from(userBonuses)
        .where(eq(userBonuses.userId, userId))
        .orderBy(desc(userBonuses.createdAt))
        .limit(limit);
    } else {
      userBonusesList = await db
        .select()
        .from(userBonuses)
        .orderBy(desc(userBonuses.createdAt))
        .limit(limit);
    }

    const result = [];
    for (const ub of userBonusesList) {
      const [bonus] = await db.select().from(bonuses).where(eq(bonuses.id, ub.bonusId));
      const [user] = await db.select().from(users).where(eq(users.id, ub.userId));
      
      result.push({
        id: ub.id,
        bonusName: bonus?.name || "Bônus",
        bonusAmount: parseFloat(ub.bonusAmount),
        rolloverTotal: parseFloat(ub.rolloverTotal),
        rolloverRemaining: parseFloat(ub.rolloverRemaining),
        status: ub.status,
        expiresAt: ub.expiresAt,
        createdAt: ub.createdAt,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
        } : null,
      });
    }

    res.json({ userBonuses: result });
  } catch (error: any) {
    console.error("Admin get user bonuses error:", error);
    res.status(500).json({ error: "Erro ao buscar bônus de usuários" });
  }
});

router.post("/user-bonuses/:id/cancel", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "Motivo é obrigatório" });
    }

    const result = await cancelUserBonus(id, adminId, reason);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: "Bônus cancelado" });
  } catch (error: any) {
    console.error("Admin cancel user bonus error:", error);
    res.status(500).json({ error: "Erro ao cancelar bônus" });
  }
});

export default router;
