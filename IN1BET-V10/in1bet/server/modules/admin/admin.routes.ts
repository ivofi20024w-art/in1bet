import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users, wallets, pixWithdrawals, pixDeposits, transactions, bonuses, userBonuses, adminAuditLogs, TransactionType, AdminAction, sportsBetSlips, sportsMatches, bets } from "@shared/schema";
import { eq, desc, count, sql, and, gte, lte, sum } from "drizzle-orm";
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
import { createAuditLog } from "./audit.service";

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

router.get("/dashboard-stats", adminCheck, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(todayStart);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult?.count || 0;

    const [newUsersToday] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, todayStart));

    const [newUsersWeek] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, weekAgo));

    const [newUsersMonth] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, monthAgo));

    const [depositsToday] = await db
      .select({ total: sum(pixDeposits.amount) })
      .from(pixDeposits)
      .where(and(
        eq(pixDeposits.status, "COMPLETED"),
        gte(pixDeposits.paidAt, todayStart)
      ));

    const [depositsWeek] = await db
      .select({ total: sum(pixDeposits.amount) })
      .from(pixDeposits)
      .where(and(
        eq(pixDeposits.status, "COMPLETED"),
        gte(pixDeposits.paidAt, weekAgo)
      ));

    const [depositsMonth] = await db
      .select({ total: sum(pixDeposits.amount) })
      .from(pixDeposits)
      .where(and(
        eq(pixDeposits.status, "COMPLETED"),
        gte(pixDeposits.paidAt, monthAgo)
      ));

    const [withdrawalsToday] = await db
      .select({ total: sum(pixWithdrawals.amount) })
      .from(pixWithdrawals)
      .where(and(
        eq(pixWithdrawals.status, "PAID"),
        gte(pixWithdrawals.paidAt, todayStart)
      ));

    const [withdrawalsWeek] = await db
      .select({ total: sum(pixWithdrawals.amount) })
      .from(pixWithdrawals)
      .where(and(
        eq(pixWithdrawals.status, "PAID"),
        gte(pixWithdrawals.paidAt, weekAgo)
      ));

    const [withdrawalsMonth] = await db
      .select({ total: sum(pixWithdrawals.amount) })
      .from(pixWithdrawals)
      .where(and(
        eq(pixWithdrawals.status, "PAID"),
        gte(pixWithdrawals.paidAt, monthAgo)
      ));

    const [pendingWithdrawals] = await db
      .select({ count: count(), total: sum(pixWithdrawals.amount) })
      .from(pixWithdrawals)
      .where(eq(pixWithdrawals.status, "PENDING"));

    const [approvedWithdrawals] = await db
      .select({ count: count(), total: sum(pixWithdrawals.amount) })
      .from(pixWithdrawals)
      .where(eq(pixWithdrawals.status, "APPROVED"));

    const [totalBonusGiven] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, TransactionType.BONUS_CREDIT));

    const [totalBonusConverted] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, TransactionType.BONUS_CONVERT));

    const [activeBonusesCount] = await db
      .select({ count: count() })
      .from(userBonuses)
      .where(eq(userBonuses.status, "ACTIVE"));

    const [totalWalletBalance] = await db
      .select({ 
        realBalance: sum(wallets.balance),
        bonusBalance: sum(wallets.bonusBalance),
        lockedBalance: sum(wallets.lockedBalance),
      })
      .from(wallets);

    const [pendingSportsBets] = await db
      .select({ count: count(), total: sum(sportsBetSlips.stake) })
      .from(sportsBetSlips)
      .where(eq(sportsBetSlips.status, "PENDING"));

    const [liveMatches] = await db
      .select({ count: count() })
      .from(sportsMatches)
      .where(eq(sportsMatches.status, "LIVE"));

    const [todaySportsBets] = await db
      .select({ count: count(), total: sum(sportsBetSlips.stake), potentialPayout: sum(sportsBetSlips.potentialWin) })
      .from(sportsBetSlips)
      .where(gte(sportsBetSlips.createdAt, todayStart));

    const [casinoGamesToday] = await db
      .select({ count: count(), total: sum(bets.betAmount) })
      .from(bets)
      .where(gte(bets.createdAt, todayStart));

    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [dayDeposits] = await db
        .select({ total: sum(pixDeposits.amount) })
        .from(pixDeposits)
        .where(and(
          eq(pixDeposits.status, "COMPLETED"),
          gte(pixDeposits.paidAt, dayStart),
          lte(pixDeposits.paidAt, dayEnd)
        ));

      const [dayWithdrawals] = await db
        .select({ total: sum(pixWithdrawals.amount) })
        .from(pixWithdrawals)
        .where(and(
          eq(pixWithdrawals.status, "PAID"),
          gte(pixWithdrawals.paidAt, dayStart),
          lte(pixWithdrawals.paidAt, dayEnd)
        ));

      last30Days.push({
        date: dayStart.toISOString().split('T')[0],
        deposits: parseFloat(dayDeposits?.total || "0"),
        withdrawals: parseFloat(dayWithdrawals?.total || "0"),
      });
    }

    res.json({
      users: {
        total: totalUsers,
        today: newUsersToday?.count || 0,
        week: newUsersWeek?.count || 0,
        month: newUsersMonth?.count || 0,
      },
      deposits: {
        today: parseFloat(depositsToday?.total || "0"),
        week: parseFloat(depositsWeek?.total || "0"),
        month: parseFloat(depositsMonth?.total || "0"),
      },
      withdrawals: {
        today: parseFloat(withdrawalsToday?.total || "0"),
        week: parseFloat(withdrawalsWeek?.total || "0"),
        month: parseFloat(withdrawalsMonth?.total || "0"),
        pending: {
          count: pendingWithdrawals?.count || 0,
          total: parseFloat(pendingWithdrawals?.total || "0"),
        },
        approved: {
          count: approvedWithdrawals?.count || 0,
          total: parseFloat(approvedWithdrawals?.total || "0"),
        },
      },
      profit: {
        today: parseFloat(depositsToday?.total || "0") - parseFloat(withdrawalsToday?.total || "0"),
        week: parseFloat(depositsWeek?.total || "0") - parseFloat(withdrawalsWeek?.total || "0"),
        month: parseFloat(depositsMonth?.total || "0") - parseFloat(withdrawalsMonth?.total || "0"),
      },
      bonuses: {
        totalGiven: parseFloat(totalBonusGiven?.total || "0"),
        totalConverted: parseFloat(totalBonusConverted?.total || "0"),
        activeCount: activeBonusesCount?.count || 0,
      },
      platform: {
        totalRealBalance: parseFloat(totalWalletBalance?.realBalance || "0"),
        totalBonusBalance: parseFloat(totalWalletBalance?.bonusBalance || "0"),
        totalLockedBalance: parseFloat(totalWalletBalance?.lockedBalance || "0"),
      },
      sports: {
        pendingBets: pendingSportsBets?.count || 0,
        pendingStake: parseFloat(pendingSportsBets?.total || "0"),
        liveMatches: liveMatches?.count || 0,
        todayBets: todaySportsBets?.count || 0,
        todayStake: parseFloat(todaySportsBets?.total || "0"),
        todayPotentialPayout: parseFloat(todaySportsBets?.potentialPayout || "0"),
      },
      casino: {
        todayGames: casinoGamesToday?.count || 0,
        todayVolume: parseFloat(casinoGamesToday?.total || "0"),
      },
      chartData: last30Days,
    });
  } catch (error: any) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas do dashboard" });
  }
});

router.get("/deposits", adminCheck, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const status = req.query.status as string;
    const cpf = req.query.cpf as string;

    let depositsQuery = db.select().from(pixDeposits).orderBy(desc(pixDeposits.createdAt)).limit(limit);
    
    const depositsList = await depositsQuery;

    const depositsWithUsers = [];
    for (const deposit of depositsList) {
      if (status && deposit.status !== status) continue;
      
      const [user] = await db.select().from(users).where(eq(users.id, deposit.userId));
      
      if (cpf && user && !user.cpf.includes(cpf.replace(/\D/g, ''))) continue;
      
      depositsWithUsers.push({
        id: deposit.id,
        externalId: deposit.externalId,
        amount: parseFloat(deposit.amount),
        netAmount: deposit.netAmount ? parseFloat(deposit.netAmount) : null,
        status: deposit.status,
        createdAt: deposit.createdAt,
        paidAt: deposit.paidAt,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          cpf: user.cpf,
        } : null,
      });
    }

    res.json({ deposits: depositsWithUsers });
  } catch (error: any) {
    console.error("Admin deposits error:", error);
    res.status(500).json({ error: "Erro ao buscar depósitos" });
  }
});

router.get("/transactions", adminCheck, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const userId = req.query.userId as string;
    const type = req.query.type as string;

    let query;
    if (userId) {
      query = db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)).limit(limit);
    } else {
      query = db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limit);
    }

    const transactionsList = await query;

    const result = [];
    for (const tx of transactionsList) {
      if (type && tx.type !== type) continue;
      
      const [user] = await db.select().from(users).where(eq(users.id, tx.userId));
      
      result.push({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        balanceBefore: parseFloat(tx.balanceBefore),
        balanceAfter: parseFloat(tx.balanceAfter),
        status: tx.status,
        referenceId: tx.referenceId,
        description: tx.description,
        createdAt: tx.createdAt,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          cpf: user.cpf,
        } : null,
      });
    }

    res.json({ transactions: result });
  } catch (error: any) {
    console.error("Admin transactions error:", error);
    res.status(500).json({ error: "Erro ao buscar transações" });
  }
});

router.get("/users/:id/wallet", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, id));

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, id))
      .orderBy(desc(transactions.createdAt))
      .limit(100);

    const userDeposits = await db
      .select()
      .from(pixDeposits)
      .where(eq(pixDeposits.userId, id))
      .orderBy(desc(pixDeposits.createdAt))
      .limit(50);

    const userWithdrawals = await db
      .select()
      .from(pixWithdrawals)
      .where(eq(pixWithdrawals.userId, id))
      .orderBy(desc(pixWithdrawals.createdAt))
      .limit(50);

    const userBonusesList = await db
      .select()
      .from(userBonuses)
      .where(eq(userBonuses.userId, id))
      .orderBy(desc(userBonuses.createdAt))
      .limit(20);

    const bonusesWithDetails = [];
    for (const ub of userBonusesList) {
      const [bonus] = await db.select().from(bonuses).where(eq(bonuses.id, ub.bonusId));
      bonusesWithDetails.push({
        id: ub.id,
        bonusName: bonus?.name || "Bônus",
        bonusAmount: parseFloat(ub.bonusAmount),
        rolloverTotal: parseFloat(ub.rolloverTotal),
        rolloverRemaining: parseFloat(ub.rolloverRemaining),
        status: ub.status,
        expiresAt: ub.expiresAt,
        createdAt: ub.createdAt,
      });
    }

    const totalDeposited = userDeposits
      .filter(d => d.status === "PAID")
      .reduce((sum, d) => sum + parseFloat(d.amount), 0);

    const totalWithdrawn = userWithdrawals
      .filter(w => w.status === "PAID")
      .reduce((sum, w) => sum + parseFloat(w.amount), 0);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        phone: user.phone,
        kycStatus: user.kycStatus,
        vipLevel: user.vipLevel,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
      wallet: wallet ? {
        balance: parseFloat(wallet.balance),
        bonusBalance: parseFloat(wallet.bonusBalance),
        lockedBalance: parseFloat(wallet.lockedBalance),
        rolloverRemaining: parseFloat(wallet.rolloverRemaining),
        rolloverTotal: parseFloat(wallet.rolloverTotal),
      } : null,
      stats: {
        totalDeposited,
        totalWithdrawn,
        bonusesReceived: userBonusesList.length,
      },
      transactions: userTransactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        balanceBefore: parseFloat(tx.balanceBefore),
        balanceAfter: parseFloat(tx.balanceAfter),
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
      deposits: userDeposits.map(d => ({
        id: d.id,
        amount: parseFloat(d.amount),
        status: d.status,
        createdAt: d.createdAt,
        paidAt: d.paidAt,
      })),
      withdrawals: userWithdrawals.map(w => ({
        id: w.id,
        amount: parseFloat(w.amount),
        status: w.status,
        pixKey: w.pixKey,
        createdAt: w.createdAt,
        paidAt: w.paidAt,
      })),
      bonuses: bonusesWithDetails,
    });
  } catch (error: any) {
    console.error("Admin user wallet error:", error);
    res.status(500).json({ error: "Erro ao buscar carteira do usuário" });
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

    const withdrawalBefore = await getWithdrawalById(id);
    const result = await approveWithdrawal(id, adminId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    await createAuditLog({
      adminId,
      action: AdminAction.WITHDRAWAL_APPROVE,
      targetType: "withdrawal",
      targetId: id,
      dataBefore: { status: withdrawalBefore?.status },
      dataAfter: { status: "APPROVED" },
    });

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

    const withdrawalBefore = await getWithdrawalById(id);
    const result = await rejectWithdrawal(id, adminId, reason);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    await createAuditLog({
      adminId,
      action: AdminAction.WITHDRAWAL_REJECT,
      targetType: "withdrawal",
      targetId: id,
      dataBefore: { status: withdrawalBefore?.status },
      dataAfter: { status: "REJECTED", rejectionReason: reason },
      reason,
    });

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

    const withdrawalBefore = await getWithdrawalById(id);
    const result = await markWithdrawalAsPaid(id, adminId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    await createAuditLog({
      adminId,
      action: AdminAction.WITHDRAWAL_PAY,
      targetType: "withdrawal",
      targetId: id,
      dataBefore: { status: withdrawalBefore?.status },
      dataAfter: { status: "PAID" },
    });

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

    const [userBonusBefore] = await db.select().from(userBonuses).where(eq(userBonuses.id, id));

    const result = await cancelUserBonus(id, adminId, reason);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    await createAuditLog({
      adminId,
      action: AdminAction.USER_BONUS_CANCEL,
      targetType: "user_bonus",
      targetId: id,
      dataBefore: userBonusBefore,
      dataAfter: { status: "CANCELLED" },
      reason,
    });

    res.json({ success: true, message: "Bônus cancelado" });
  } catch (error: any) {
    console.error("Admin cancel user bonus error:", error);
    res.status(500).json({ error: "Erro ao cancelar bônus" });
  }
});

router.post("/users/:id/block", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "Motivo do bloqueio é obrigatório" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, id));
    
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (user.isAdmin) {
      return res.status(400).json({ error: "Não é possível bloquear um administrador" });
    }

    if (user.isBlocked) {
      return res.status(400).json({ error: "Usuário já está bloqueado" });
    }

    await db.update(users)
      .set({
        isBlocked: true,
        blockReason: reason,
        blockedAt: new Date(),
        blockedBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    await createAuditLog({
      adminId,
      action: AdminAction.USER_BLOCK,
      targetType: "user",
      targetId: id,
      dataBefore: { isBlocked: false },
      dataAfter: { isBlocked: true, blockReason: reason },
      reason,
    });

    res.json({ success: true, message: "Usuário bloqueado com sucesso" });
  } catch (error: any) {
    console.error("Admin block user error:", error);
    res.status(500).json({ error: "Erro ao bloquear usuário" });
  }
});

router.post("/users/:id/unblock", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const [user] = await db.select().from(users).where(eq(users.id, id));
    
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (!user.isBlocked) {
      return res.status(400).json({ error: "Usuário não está bloqueado" });
    }

    const previousReason = user.blockReason;

    await db.update(users)
      .set({
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    await createAuditLog({
      adminId,
      action: AdminAction.USER_UNBLOCK,
      targetType: "user",
      targetId: id,
      dataBefore: { isBlocked: true, blockReason: previousReason },
      dataAfter: { isBlocked: false },
    });

    res.json({ success: true, message: "Usuário desbloqueado com sucesso" });
  } catch (error: any) {
    console.error("Admin unblock user error:", error);
    res.status(500).json({ error: "Erro ao desbloquear usuário" });
  }
});

router.get("/audit-logs", adminCheck, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    const logs = await db
      .select()
      .from(adminAuditLogs)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(limit);

    const logsWithAdmins = [];
    for (const log of logs) {
      const [admin] = await db.select().from(users).where(eq(users.id, log.adminId));
      logsWithAdmins.push({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        dataBefore: log.dataBefore ? JSON.parse(log.dataBefore) : null,
        dataAfter: log.dataAfter ? JSON.parse(log.dataAfter) : null,
        reason: log.reason,
        createdAt: log.createdAt,
        admin: admin ? {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        } : null,
      });
    }

    res.json({ logs: logsWithAdmins });
  } catch (error: any) {
    console.error("Admin audit logs error:", error);
    res.status(500).json({ error: "Erro ao buscar logs de auditoria" });
  }
});

router.put("/users/:id/auto-withdraw", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const adminId = req.user!.id;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Valor inválido para enabled" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, id));
    
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const previousValue = user.autoWithdrawAllowed || false;

    await db.update(users)
      .set({
        autoWithdrawAllowed: enabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    await createAuditLog({
      adminId,
      action: AdminAction.USER_AUTO_WITHDRAW_TOGGLE,
      targetType: "user",
      targetId: id,
      dataBefore: { autoWithdrawAllowed: previousValue },
      dataAfter: { autoWithdrawAllowed: enabled },
    });

    res.json({ 
      success: true, 
      message: enabled 
        ? "Saque automático habilitado para este usuário" 
        : "Saque automático desabilitado para este usuário"
    });
  } catch (error: any) {
    console.error("Admin toggle auto-withdraw error:", error);
    res.status(500).json({ error: "Erro ao alterar configuração de saque automático" });
  }
});

router.get("/users/:id/auto-withdraw", adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [user] = await db.select().from(users).where(eq(users.id, id));
    
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ 
      enabled: user.autoWithdrawAllowed || false,
      kycStatus: user.kycStatus,
    });
  } catch (error: any) {
    console.error("Admin get auto-withdraw error:", error);
    res.status(500).json({ error: "Erro ao buscar configuração de saque automático" });
  }
});

router.post("/settings/max-auto-withdraw", adminCheck, async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const adminId = req.user!.id;

    const parsedAmount = Math.floor(Number(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      return res.status(400).json({ error: "Valor inválido. Deve ser um número inteiro entre 1 e 100000" });
    }

    const { setMaxAutoWithdrawAmount, getMaxAutoWithdrawAmount } = await import("../settings/settings.service");
    
    const previousAmount = await getMaxAutoWithdrawAmount();
    await setMaxAutoWithdrawAmount(parsedAmount, adminId);

    res.json({ 
      success: true, 
      message: `Limite de saque automático alterado de R$ ${previousAmount.toFixed(2)} para R$ ${parsedAmount.toFixed(2)}`,
      newLimit: parsedAmount
    });
  } catch (error: any) {
    console.error("Admin set max auto-withdraw error:", error);
    res.status(500).json({ error: "Erro ao alterar limite de saque automático" });
  }
});

router.post("/settings/maturation-days", adminCheck, async (req: Request, res: Response) => {
  try {
    const { days } = req.body;
    const adminId = req.user!.id;

    const parsedDays = Math.floor(Number(days));
    if (isNaN(parsedDays) || parsedDays < 0 || parsedDays > 90) {
      return res.status(400).json({ error: "Valor inválido. Deve ser um número inteiro entre 0 e 90" });
    }

    const { setAffiliateMaturationDays, getAffiliateMaturationDays } = await import("../settings/settings.service");
    
    const previousDays = await getAffiliateMaturationDays();
    await setAffiliateMaturationDays(parsedDays, adminId);

    res.json({ 
      success: true, 
      message: `Período de maturação alterado de ${previousDays} para ${parsedDays} dias`,
      newDays: parsedDays
    });
  } catch (error: any) {
    console.error("Admin set maturation days error:", error);
    res.status(500).json({ error: "Erro ao alterar período de maturação" });
  }
});

export default router;
