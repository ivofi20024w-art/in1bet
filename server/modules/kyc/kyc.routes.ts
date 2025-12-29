import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users, kycVerifications, isValidCPF, submitKycSchema, submitKycDocumentsSchema, KycVerificationStatus } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { createKycVerification, getUserActiveKyc, createSecurityLog } from "../security/security.service";

const router = Router();

router.get("/status", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const activeKyc = await getUserActiveKyc(userId);

    res.json({
      kycStatus: user.kycStatus,
      name: user.name,
      cpf: user.cpf ? `***.***.${user.cpf.slice(-6)}` : null,
      isVerified: user.isVerified,
      verification: activeKyc
        ? {
            id: activeKyc.id,
            status: activeKyc.status,
            documentType: activeKyc.documentType,
            rejectionReason: activeKyc.rejectionReason,
            createdAt: activeKyc.createdAt,
            reviewedAt: activeKyc.reviewedAt,
          }
        : null,
    });
  } catch (error: any) {
    console.error("KYC status error:", error);
    res.status(500).json({ error: "Erro ao verificar status KYC" });
  }
});

router.post("/submit", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = submitKycSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.errors[0]?.message || "Dados inválidos",
      });
    }

    const { fullName, cpf, birthDate } = validation.data;

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (user.kycStatus === "verified") {
      return res.status(400).json({ error: "KYC já foi verificado" });
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    if (user.cpf !== formattedCpf && user.cpf !== cleanCpf) {
      const [existingUser] = await db.select().from(users).where(eq(users.cpf, formattedCpf));

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "CPF já está em uso por outra conta" });
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        name: fullName,
        cpf: formattedCpf,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        kycStatus: "verified",
        isVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    console.log(`KYC verified for user ${userId}`);

    res.json({
      success: true,
      message: "Dados verificados com sucesso",
      kycStatus: "verified",
    });
  } catch (error: any) {
    console.error("KYC submit error:", error);
    res.status(500).json({ error: "Erro ao submeter dados KYC" });
  }
});

router.post("/submit-documents", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = submitKycDocumentsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.errors[0]?.message || "Dados inválidos",
      });
    }

    const { documentType, documentFrontUrl, documentBackUrl, selfieUrl } = validation.data;

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (user.kycStatus === "verified") {
      return res.status(400).json({ error: "Sua conta já está verificada" });
    }

    const activeKyc = await getUserActiveKyc(userId);
    if (activeKyc && activeKyc.status === KycVerificationStatus.PENDING) {
      return res.status(400).json({
        error: "Você já tem uma verificação pendente. Aguarde a análise.",
      });
    }

    const verification = await createKycVerification(
      userId,
      user.cpf,
      documentType,
      documentFrontUrl,
      documentBackUrl || null,
      selfieUrl
    );

    await db
      .update(users)
      .set({
        kycStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(`KYC documents submitted for user ${userId}, verification ID: ${verification.id}`);

    res.json({
      success: true,
      message: "Documentos enviados com sucesso. Aguarde a análise.",
      verification: {
        id: verification.id,
        status: verification.status,
        createdAt: verification.createdAt,
      },
    });
  } catch (error: any) {
    console.error("KYC submit documents error:", error);
    res.status(500).json({ error: "Erro ao enviar documentos" });
  }
});

router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const verifications = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, userId))
      .orderBy(desc(kycVerifications.createdAt))
      .limit(10);

    res.json({
      verifications: verifications.map((v) => ({
        id: v.id,
        documentType: v.documentType,
        status: v.status,
        rejectionReason: v.rejectionReason,
        createdAt: v.createdAt,
        reviewedAt: v.reviewedAt,
      })),
    });
  } catch (error: any) {
    console.error("KYC history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

export default router;
