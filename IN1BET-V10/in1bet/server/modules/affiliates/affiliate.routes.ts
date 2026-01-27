import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users, affiliates, AdminRole } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  createAffiliate,
  createAffiliateLink,
  getAffiliateLinkByCode,
  trackClick,
  getAllAffiliates,
  getAffiliateById,
  getAffiliateLinks,
  getAffiliateConversions,
  getAffiliatePayouts,
  getAffiliateDashboardStats,
  requestAffiliatePayout,
  approveAffiliatePayout,
  rejectAffiliatePayout,
  markPayoutAsPaid,
  checkAndQualifyConversion,
  markConversionAsFraud,
  toggleAffiliateStatus,
} from "./affiliate.service";
import { createAffiliateSchema, createAffiliateLinkSchema, requestAffiliatePayoutSchema } from "@shared/schema";

const router = Router();

const adminCheck = async (req: Request, res: Response, next: Function) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    (req as any).adminUser = user;
    next();
  } catch (error) {
    console.error("Admin check error in affiliates:", error);
    return res.status(500).json({ error: "Erro ao verificar permissões" });
  }
};

router.get("/track/:code", async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const link = await getAffiliateLinkByCode(code);
    
    if (!link) {
      return res.redirect("/register");
    }

    const ipAddress = req.headers["x-forwarded-for"] as string || req.ip;
    const userAgent = req.headers["user-agent"];
    const referer = req.headers["referer"];

    await trackClick(link.id, ipAddress, userAgent, referer);

    const redirectUrl = `/register?ref=${code}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Affiliate track error:", error);
    res.redirect("/register");
  }
});

router.get("/link/:code", async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const link = await getAffiliateLinkByCode(code);
    
    if (!link) {
      return res.status(404).json({ error: "Link não encontrado" });
    }

    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.id, link.affiliateId));

    res.json({
      valid: true,
      affiliateId: link.affiliateId,
      affiliateName: affiliate?.name,
      code: link.code,
    });
  } catch (error) {
    console.error("Affiliate link check error:", error);
    res.status(500).json({ error: "Erro ao verificar link" });
  }
});

router.get("/dashboard", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, userId));

    if (!affiliate) {
      return res.status(404).json({ error: "Você não é um afiliado" });
    }

    const stats = await getAffiliateDashboardStats(affiliate.id);
    const links = await getAffiliateLinks(affiliate.id);
    const conversions = await getAffiliateConversions(affiliate.id);
    const payouts = await getAffiliatePayouts(affiliate.id);

    res.json({
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        status: affiliate.status,
        commissionType: affiliate.commissionType,
        cpaValue: parseFloat(affiliate.cpaValue),
        revsharePercentage: parseFloat(affiliate.revsharePercentage),
      },
      stats,
      links: links.map(l => ({
        id: l.id,
        code: l.code,
        name: l.name,
        url: `/ref/${l.code}`,
        clicks: parseInt(l.clicks),
        registrations: parseInt(l.registrations),
        conversions: parseInt(l.conversions),
        isActive: l.isActive,
      })),
      recentConversions: conversions.slice(0, 10),
      recentPayouts: payouts.slice(0, 10),
    });
  } catch (error) {
    console.error("Affiliate dashboard error:", error);
    res.status(500).json({ error: "Erro ao carregar dashboard" });
  }
});

router.post("/payouts/request", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, userId));

    if (!affiliate) {
      return res.status(404).json({ error: "Você não é um afiliado" });
    }

    const parsed = requestAffiliatePayoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos", details: parsed.error.errors });
    }

    const payout = await requestAffiliatePayout(
      affiliate.id,
      parsed.data.amount,
      parsed.data.pixKey,
      parsed.data.pixKeyType
    );

    res.json({ success: true, payout });
  } catch (error: any) {
    console.error("Affiliate payout request error:", error);
    res.status(400).json({ error: error.message || "Erro ao solicitar pagamento" });
  }
});

router.post("/links", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, userId));

    if (!affiliate) {
      return res.status(404).json({ error: "Você não é um afiliado" });
    }

    const parsed = createAffiliateLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos", details: parsed.error.errors });
    }

    const link = await createAffiliateLink(
      affiliate.id, 
      { name: parsed.data.name, code: parsed.data.code },
      userId
    );

    res.json({ 
      success: true, 
      link: {
        id: link.id,
        code: link.code,
        name: link.name,
        url: `/ref/${link.code}`,
        clicks: 0,
        registrations: 0,
        conversions: 0,
        isActive: link.isActive,
      }
    });
  } catch (error: any) {
    console.error("Affiliate create link error:", error);
    res.status(400).json({ error: error.message || "Erro ao criar link" });
  }
});

router.post("/become", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const [existingAffiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, userId));

    if (existingAffiliate) {
      return res.status(400).json({ error: "Você já é um afiliado" });
    }

    const affiliate = await createAffiliate({
      name: user.name,
      email: user.email,
      cpf: user.cpf || undefined,
      commissionType: "CPA",
      cpaValue: 30,
      revsharePercentage: 25,
      minDepositForCpa: 50,
      minWagerForCpa: 100,
    }, userId);

    const link = await createAffiliateLink(
      affiliate.id, 
      { name: "Principal" },
      userId
    );

    res.json({ 
      success: true, 
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        status: affiliate.status,
        commissionType: affiliate.commissionType,
      },
      link: {
        code: link.code,
        url: `/ref/${link.code}`,
      }
    });
  } catch (error: any) {
    console.error("Become affiliate error:", error);
    res.status(400).json({ error: error.message || "Erro ao se tornar afiliado" });
  }
});

router.get("/admin/search-users", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const searchTerm = (q as string || "").toLowerCase();

    if (!searchTerm || searchTerm.length < 2) {
      return res.json({ users: [] });
    }

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        cpf: users.cpf,
      })
      .from(users)
      .limit(50);

    const filtered = allUsers.filter(u => 
      u.name.toLowerCase().includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm) ||
      (u.cpf && u.cpf.includes(searchTerm))
    ).slice(0, 10);

    const existingAffiliateUserIds = await db
      .select({ userId: affiliates.userId })
      .from(affiliates);
    
    const affiliateUserIds = new Set(existingAffiliateUserIds.map(a => a.userId));

    const usersWithStatus = filtered.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      cpf: u.cpf ? `***.***.${u.cpf.slice(-6, -3)}-**` : null,
      isAffiliate: affiliateUserIds.has(u.id),
    }));

    res.json({ users: usersWithStatus });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

router.get("/admin", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const allAffiliates = await getAllAffiliates();

    res.json({
      affiliates: allAffiliates.map(a => ({
        ...a,
        cpaValue: parseFloat(a.cpaValue),
        revsharePercentage: parseFloat(a.revsharePercentage),
        totalEarnings: parseFloat(a.totalEarnings),
        pendingBalance: parseFloat(a.pendingBalance),
        paidBalance: parseFloat(a.paidBalance),
        totalReferrals: parseInt(a.totalReferrals),
        qualifiedReferrals: parseInt(a.qualifiedReferrals),
      })),
    });
  } catch (error) {
    console.error("Admin get affiliates error:", error);
    res.status(500).json({ error: "Erro ao buscar afiliados" });
  }
});

router.post("/admin", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminUser.id;
    
    const parsed = createAffiliateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos", details: parsed.error.errors });
    }

    const affiliate = await createAffiliate(parsed.data, adminId);

    res.json({ success: true, affiliate });
  } catch (error: any) {
    console.error("Admin create affiliate error:", error);
    res.status(400).json({ error: error.message || "Erro ao criar afiliado" });
  }
});

router.get("/admin/:id", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const affiliate = await getAffiliateById(id);
    
    if (!affiliate) {
      return res.status(404).json({ error: "Afiliado não encontrado" });
    }

    const links = await getAffiliateLinks(id);
    const conversions = await getAffiliateConversions(id);
    const payouts = await getAffiliatePayouts(id);
    const stats = await getAffiliateDashboardStats(id);

    res.json({
      affiliate: {
        ...affiliate,
        cpaValue: parseFloat(affiliate.cpaValue),
        revsharePercentage: parseFloat(affiliate.revsharePercentage),
        totalEarnings: parseFloat(affiliate.totalEarnings),
        pendingBalance: parseFloat(affiliate.pendingBalance),
        paidBalance: parseFloat(affiliate.paidBalance),
      },
      stats,
      links,
      conversions,
      payouts,
    });
  } catch (error) {
    console.error("Admin get affiliate error:", error);
    res.status(500).json({ error: "Erro ao buscar afiliado" });
  }
});

router.post("/admin/:id/toggle-status", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminUser.id;

    const updated = await toggleAffiliateStatus(id, adminId);

    res.json({ 
      success: true, 
      affiliate: updated,
      message: updated.status === "ACTIVE" ? "Afiliado ativado" : "Afiliado suspenso"
    });
  } catch (error: any) {
    console.error("Admin toggle affiliate status error:", error);
    res.status(400).json({ error: error.message || "Erro ao alterar status" });
  }
});

router.post("/admin/:id/links", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminUser.id;
    
    const parsed = createAffiliateLinkSchema.safeParse({ ...req.body, affiliateId: id });
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos", details: parsed.error.errors });
    }

    const link = await createAffiliateLink(id, parsed.data, adminId);

    res.json({ 
      success: true, 
      link: {
        ...link,
        url: `/ref/${link.code}`,
      }
    });
  } catch (error: any) {
    console.error("Admin create affiliate link error:", error);
    res.status(400).json({ error: error.message || "Erro ao criar link" });
  }
});

router.post("/admin/conversions/:id/qualify", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminUser.id;

    const result = await checkAndQualifyConversion(id, adminId);

    if (!result.qualified) {
      return res.status(400).json({ error: result.reason });
    }

    res.json({ success: true, message: "Conversão qualificada com sucesso" });
  } catch (error: any) {
    console.error("Admin qualify conversion error:", error);
    res.status(400).json({ error: error.message || "Erro ao qualificar conversão" });
  }
});

router.post("/admin/conversions/:id/fraud", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).adminUser.id;

    if (!reason) {
      return res.status(400).json({ error: "Motivo obrigatório" });
    }

    await markConversionAsFraud(id, reason, adminId);

    res.json({ success: true, message: "Conversão marcada como fraude" });
  } catch (error: any) {
    console.error("Admin fraud conversion error:", error);
    res.status(400).json({ error: error.message || "Erro ao marcar fraude" });
  }
});

router.post("/admin/payouts/:id/approve", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminUser.id;

    await approveAffiliatePayout(id, adminId);

    res.json({ success: true, message: "Pagamento aprovado" });
  } catch (error: any) {
    console.error("Admin approve payout error:", error);
    res.status(400).json({ error: error.message || "Erro ao aprovar pagamento" });
  }
});

router.post("/admin/payouts/:id/pay", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminUser.id;

    await markPayoutAsPaid(id, adminId);

    res.json({ success: true, message: "Pagamento realizado" });
  } catch (error: any) {
    console.error("Admin pay payout error:", error);
    res.status(400).json({ error: error.message || "Erro ao pagar" });
  }
});

router.post("/admin/payouts/:id/reject", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).adminUser.id;

    if (!reason) {
      return res.status(400).json({ error: "Motivo da rejeição obrigatório" });
    }

    await rejectAffiliatePayout(id, adminId, reason);

    res.json({ success: true, message: "Pagamento rejeitado e saldo liberado" });
  } catch (error: any) {
    console.error("Admin reject payout error:", error);
    res.status(400).json({ error: error.message || "Erro ao rejeitar pagamento" });
  }
});

export default router;
