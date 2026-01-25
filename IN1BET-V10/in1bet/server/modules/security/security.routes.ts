import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users, AdminRole } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  getPendingKycVerifications,
  getApprovedKycVerifications,
  getRejectedKycVerifications,
  getKycVerificationById,
  approveKyc,
  rejectKyc,
  getSecurityLogs,
  getKycStats,
} from "./security.service";

const router = Router();

router.use(authMiddleware);

const securityCheck = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));

    if (!user) {
      return res.status(403).json({ error: "Usuário não encontrado" });
    }

    const hasAccess =
      user.isAdmin ||
      user.adminRole === AdminRole.ADMIN ||
      user.adminRole === AdminRole.SECURITY;

    if (!hasAccess) {
      return res.status(403).json({ error: "Acesso negado - Apenas equipe de segurança" });
    }

    next();
  } catch (error) {
    console.error("Security check error:", error);
    return res.status(500).json({ error: "Erro ao verificar permissões" });
  }
};

router.get("/stats", securityCheck, async (req: Request, res: Response) => {
  try {
    const stats = await getKycStats();
    res.json(stats);
  } catch (error: any) {
    console.error("Security stats error:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

router.get("/kyc/pending", securityCheck, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const verifications = await getPendingKycVerifications(limit);

    res.json({
      verifications: verifications.map((v) => ({
        id: v.id,
        userId: v.userId,
        cpf: v.cpf,
        documentType: v.documentType,
        documentFrontUrl: v.documentFrontUrl,
        documentBackUrl: v.documentBackUrl,
        selfieUrl: v.selfieUrl,
        status: v.status,
        createdAt: v.createdAt,
        user: v.user,
        stats: v.stats,
      })),
    });
  } catch (error: any) {
    console.error("Get pending KYC error:", error);
    res.status(500).json({ error: "Erro ao buscar verificações pendentes" });
  }
});

router.get("/kyc/approved", securityCheck, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const verifications = await getApprovedKycVerifications(limit);

    res.json({
      verifications: verifications.map((v) => ({
        id: v.id,
        userId: v.userId,
        cpf: v.cpf,
        documentType: v.documentType,
        status: v.status,
        reviewedAt: v.reviewedAt,
        createdAt: v.createdAt,
        user: v.user,
      })),
    });
  } catch (error: any) {
    console.error("Get approved KYC error:", error);
    res.status(500).json({ error: "Erro ao buscar verificações aprovadas" });
  }
});

router.get("/kyc/rejected", securityCheck, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const verifications = await getRejectedKycVerifications(limit);

    res.json({
      verifications: verifications.map((v) => ({
        id: v.id,
        userId: v.userId,
        cpf: v.cpf,
        documentType: v.documentType,
        status: v.status,
        rejectionReason: v.rejectionReason,
        reviewedAt: v.reviewedAt,
        createdAt: v.createdAt,
        user: v.user,
      })),
    });
  } catch (error: any) {
    console.error("Get rejected KYC error:", error);
    res.status(500).json({ error: "Erro ao buscar verificações rejeitadas" });
  }
});

router.get("/kyc/:id", securityCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const verification = await getKycVerificationById(id);

    if (!verification) {
      return res.status(404).json({ error: "Verificação não encontrada" });
    }

    res.json({ verification });
  } catch (error: any) {
    console.error("Get KYC by ID error:", error);
    res.status(500).json({ error: "Erro ao buscar verificação" });
  }
});

router.post("/kyc/:id/approve", securityCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const result = await approveKyc(id, adminId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "KYC aprovado com sucesso",
      verification: result.verification,
    });
  } catch (error: any) {
    console.error("Approve KYC error:", error);
    res.status(500).json({ error: "Erro ao aprovar KYC" });
  }
});

router.post("/kyc/:id/reject", securityCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "Motivo da rejeição é obrigatório" });
    }

    const result = await rejectKyc(id, adminId, reason);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "KYC rejeitado",
      verification: result.verification,
    });
  } catch (error: any) {
    console.error("Reject KYC error:", error);
    res.status(500).json({ error: "Erro ao rejeitar KYC" });
  }
});

router.get("/logs", securityCheck, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const logs = await getSecurityLogs(limit);

    res.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        userId: log.userId,
        reason: log.reason,
        createdAt: log.createdAt,
        admin: {
          id: log.admin.id,
          name: log.admin.name,
          email: log.admin.email,
        },
      })),
    });
  } catch (error: any) {
    console.error("Get security logs error:", error);
    res.status(500).json({ error: "Erro ao buscar logs de segurança" });
  }
});

export default router;
