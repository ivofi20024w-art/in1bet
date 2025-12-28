import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users, isValidCPF, submitKycSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/status", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({
      kycStatus: user.kycStatus,
      name: user.name,
      cpf: user.cpf ? `***.***.${user.cpf.slice(-6)}` : null,
      isVerified: user.isVerified,
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
        error: validation.error.errors[0]?.message || "Dados inválidos" 
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
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.cpf, formattedCpf));

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

export default router;
