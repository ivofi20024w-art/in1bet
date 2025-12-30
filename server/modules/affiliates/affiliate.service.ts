import { db } from "../../db";
import { 
  affiliates, 
  affiliateLinks, 
  affiliateConversions, 
  affiliatePayouts,
  affiliateClicks,
  users,
  pixDeposits,
  transactions,
  adminAuditLogs,
  AdminAction,
  AffiliateStatus,
  CommissionType,
  ConversionStatus,
  PayoutStatus,
  TransactionType,
  type Affiliate,
  type AffiliateLink,
  type AffiliateConversion,
  type AffiliatePayout,
  type User,
} from "@shared/schema";
import { eq, and, desc, sum, count, gte, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function createAffiliate(
  data: {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    commissionType?: string;
    cpaValue?: number;
    revsharePercentage?: number;
    minDepositForCpa?: number;
    minWagerForCpa?: number;
  },
  createdBy: string
): Promise<Affiliate> {
  const [affiliate] = await db
    .insert(affiliates)
    .values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf,
      commissionType: data.commissionType || CommissionType.CPA,
      cpaValue: (data.cpaValue || 50).toFixed(2),
      revsharePercentage: (data.revsharePercentage || 30).toFixed(2),
      minDepositForCpa: (data.minDepositForCpa || 50).toFixed(2),
      minWagerForCpa: (data.minWagerForCpa || 100).toFixed(2),
      createdBy,
    })
    .returning();

  await db.insert(adminAuditLogs).values({
    adminId: createdBy,
    action: AdminAction.AFFILIATE_CREATE,
    targetType: "AFFILIATE",
    targetId: affiliate.id,
    dataAfter: JSON.stringify({ name: data.name, email: data.email }),
  });

  return affiliate;
}

export async function createAffiliateLink(
  affiliateId: string,
  data: {
    code?: string;
    name?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  },
  createdBy: string
): Promise<AffiliateLink> {
  const code = data.code || generateReferralCode();

  const [existingCode] = await db
    .select()
    .from(affiliateLinks)
    .where(eq(affiliateLinks.code, code));

  if (existingCode) {
    throw new Error("Código de referência já existe");
  }

  const [link] = await db
    .insert(affiliateLinks)
    .values({
      affiliateId,
      code,
      name: data.name,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
    })
    .returning();

  await db.insert(adminAuditLogs).values({
    adminId: createdBy,
    action: AdminAction.AFFILIATE_LINK_CREATE,
    targetType: "AFFILIATE_LINK",
    targetId: link.id,
    dataAfter: JSON.stringify({ code, affiliateId }),
  });

  return link;
}

export async function getAffiliateLinkByCode(code: string): Promise<AffiliateLink | null> {
  const [link] = await db
    .select()
    .from(affiliateLinks)
    .where(and(
      eq(affiliateLinks.code, code),
      eq(affiliateLinks.isActive, true)
    ));

  return link || null;
}

export async function trackClick(
  linkId: string,
  ipAddress?: string,
  userAgent?: string,
  referer?: string
): Promise<void> {
  await db.insert(affiliateClicks).values({
    affiliateLinkId: linkId,
    ipAddress,
    userAgent,
    referer,
  });

  await db
    .update(affiliateLinks)
    .set({
      clicks: sql`${affiliateLinks.clicks} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(affiliateLinks.id, linkId));
}

export async function createConversion(
  userId: string,
  affiliateId: string,
  affiliateLinkId: string | null,
  commissionType: string,
  userIp?: string,
  userDevice?: string
): Promise<AffiliateConversion> {
  const [conversion] = await db
    .insert(affiliateConversions)
    .values({
      affiliateId,
      affiliateLinkId,
      userId,
      commissionType,
      userIp,
      userDevice,
      status: ConversionStatus.PENDING,
    })
    .returning();

  await db
    .update(affiliates)
    .set({
      totalReferrals: sql`${affiliates.totalReferrals} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, affiliateId));

  if (affiliateLinkId) {
    await db
      .update(affiliateLinks)
      .set({
        registrations: sql`${affiliateLinks.registrations} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(affiliateLinks.id, affiliateLinkId));
  }

  return conversion;
}

interface FraudCheckResult {
  isFraud: boolean;
  reasons: string[];
}

export async function checkForFraud(
  userId: string,
  affiliateId: string,
  userIp?: string,
  userCpf?: string,
  userEmail?: string
): Promise<FraudCheckResult> {
  const reasons: string[] = [];

  const [affiliate] = await db
    .select()
    .from(affiliates)
    .where(eq(affiliates.id, affiliateId));

  if (!affiliate) {
    return { isFraud: false, reasons: [] };
  }

  if (userCpf && affiliate.cpf && userCpf.replace(/\D/g, "") === affiliate.cpf.replace(/\D/g, "")) {
    reasons.push("Auto-referral: CPF do afiliado igual ao usuário");
  }

  if (userEmail && affiliate.email.toLowerCase() === userEmail.toLowerCase()) {
    reasons.push("Auto-referral: Email do afiliado igual ao usuário");
  }

  if (userIp) {
    const allConversionsFromIp = await db
      .select()
      .from(affiliateConversions)
      .where(eq(affiliateConversions.userIp, userIp));

    if (allConversionsFromIp.length >= 3) {
      reasons.push(`IP suspeito: ${allConversionsFromIp.length} conversões do mesmo IP na plataforma`);
    }
  }

  if (userCpf) {
    const existingConversions = await db
      .select()
      .from(affiliateConversions)
      .innerJoin(users, eq(affiliateConversions.userId, users.id))
      .where(eq(users.cpf, userCpf));

    if (existingConversions.length > 0) {
      reasons.push("CPF já foi referenciado por outro afiliado na plataforma");
    }
  }

  return {
    isFraud: reasons.length > 0,
    reasons,
  };
}

export async function markConversionAsFraudSystem(
  conversionId: string,
  reason: string
): Promise<void> {
  await db
    .update(affiliateConversions)
    .set({
      status: ConversionStatus.FRAUD,
      fraudReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(affiliateConversions.id, conversionId));

  await db.insert(adminAuditLogs).values({
    adminId: "SYSTEM_FRAUD_DETECTION",
    action: AdminAction.AFFILIATE_CONVERSION_FRAUD,
    targetType: "AFFILIATE_CONVERSION",
    targetId: conversionId,
    dataAfter: JSON.stringify({ status: "FRAUD", reason, detectedBy: "SYSTEM" }),
  });

  console.log(`[AFFILIATE_FRAUD] Conversion ${conversionId} marked as fraud: ${reason}`);
}

export async function updateConversionStats(
  userId: string
): Promise<void> {
  const [conversion] = await db
    .select()
    .from(affiliateConversions)
    .where(eq(affiliateConversions.userId, userId));

  if (!conversion) return;

  const [depositSum] = await db
    .select({ total: sum(pixDeposits.amount) })
    .from(pixDeposits)
    .where(and(
      eq(pixDeposits.userId, userId),
      eq(pixDeposits.status, "COMPLETED")
    ));

  const [wagerSum] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, TransactionType.BET)
    ));

  const depositAmount = parseFloat(depositSum?.total || "0");
  const wagerAmount = parseFloat(wagerSum?.total || "0");

  await db
    .update(affiliateConversions)
    .set({
      depositAmount: depositAmount.toFixed(2),
      wagerAmount: wagerAmount.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(affiliateConversions.id, conversion.id));
}

export async function checkAndQualifyConversion(
  conversionId: string,
  adminId?: string
): Promise<{ qualified: boolean; reason?: string }> {
  const [conversion] = await db
    .select()
    .from(affiliateConversions)
    .where(eq(affiliateConversions.id, conversionId));

  if (!conversion) {
    return { qualified: false, reason: "Conversão não encontrada" };
  }

  if (conversion.status !== ConversionStatus.PENDING) {
    return { qualified: false, reason: "Conversão já processada" };
  }

  const [affiliate] = await db
    .select()
    .from(affiliates)
    .where(eq(affiliates.id, conversion.affiliateId));

  if (!affiliate) {
    return { qualified: false, reason: "Afiliado não encontrado" };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, conversion.userId));

  if (!user) {
    return { qualified: false, reason: "Usuário não encontrado" };
  }

  if (user.kycStatus !== "verified") {
    return { qualified: false, reason: "KYC do usuário não verificado" };
  }

  const depositAmount = parseFloat(conversion.depositAmount);
  const wagerAmount = parseFloat(conversion.wagerAmount);
  const minDeposit = parseFloat(affiliate.minDepositForCpa);
  const minWager = parseFloat(affiliate.minWagerForCpa);

  if (depositAmount < minDeposit) {
    return { qualified: false, reason: `Depósito mínimo não atingido (R$ ${depositAmount} / R$ ${minDeposit})` };
  }

  if (wagerAmount < minWager) {
    return { qualified: false, reason: `Apostas mínimas não atingidas (R$ ${wagerAmount} / R$ ${minWager})` };
  }

  let commissionValue = 0;
  const commissionType = conversion.commissionType;

  if (commissionType === CommissionType.CPA || commissionType === CommissionType.HYBRID) {
    commissionValue += parseFloat(affiliate.cpaValue);
  }

  if (commissionType === CommissionType.REVSHARE || commissionType === CommissionType.HYBRID) {
    const netRevenue = wagerAmount * 0.05;
    const revshareAmount = netRevenue * (parseFloat(affiliate.revsharePercentage) / 100);
    commissionValue += revshareAmount;

    await db
      .update(affiliateConversions)
      .set({
        netRevenue: netRevenue.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(affiliateConversions.id, conversionId));
  }

  await db
    .update(affiliateConversions)
    .set({
      status: ConversionStatus.APPROVED,
      commissionValue: commissionValue.toFixed(2),
      qualifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(affiliateConversions.id, conversionId));

  await db
    .update(affiliates)
    .set({
      qualifiedReferrals: sql`${affiliates.qualifiedReferrals} + 1`,
      pendingBalance: sql`${affiliates.pendingBalance} + ${commissionValue}`,
      totalEarnings: sql`${affiliates.totalEarnings} + ${commissionValue}`,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, conversion.affiliateId));

  if (conversion.affiliateLinkId) {
    await db
      .update(affiliateLinks)
      .set({
        conversions: sql`${affiliateLinks.conversions} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(affiliateLinks.id, conversion.affiliateLinkId));
  }

  if (adminId) {
    await db.insert(adminAuditLogs).values({
      adminId,
      action: AdminAction.AFFILIATE_CONVERSION_APPROVE,
      targetType: "AFFILIATE_CONVERSION",
      targetId: conversionId,
      dataAfter: JSON.stringify({ commissionValue, status: "APPROVED" }),
    });
  }

  return { qualified: true };
}

export async function markConversionAsFraud(
  conversionId: string,
  reason: string,
  adminId: string
): Promise<void> {
  const [conversion] = await db
    .select()
    .from(affiliateConversions)
    .where(eq(affiliateConversions.id, conversionId));

  if (!conversion) return;

  await db
    .update(affiliateConversions)
    .set({
      status: ConversionStatus.FRAUD,
      fraudReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(affiliateConversions.id, conversionId));

  await db.insert(adminAuditLogs).values({
    adminId,
    action: AdminAction.AFFILIATE_CONVERSION_FRAUD,
    targetType: "AFFILIATE_CONVERSION",
    targetId: conversionId,
    dataAfter: JSON.stringify({ status: "FRAUD", reason }),
  });
}

export async function getAffiliateById(affiliateId: string): Promise<Affiliate | null> {
  const [affiliate] = await db
    .select()
    .from(affiliates)
    .where(eq(affiliates.id, affiliateId));

  return affiliate || null;
}

export async function getAllAffiliates(): Promise<Affiliate[]> {
  return await db
    .select()
    .from(affiliates)
    .orderBy(desc(affiliates.createdAt));
}

export async function getAffiliateLinks(affiliateId: string): Promise<AffiliateLink[]> {
  return await db
    .select()
    .from(affiliateLinks)
    .where(eq(affiliateLinks.affiliateId, affiliateId))
    .orderBy(desc(affiliateLinks.createdAt));
}

export async function getAffiliateConversions(
  affiliateId: string,
  status?: string
): Promise<(AffiliateConversion & { user: Partial<User> })[]> {
  let query = db
    .select()
    .from(affiliateConversions)
    .where(eq(affiliateConversions.affiliateId, affiliateId));

  if (status) {
    query = db
      .select()
      .from(affiliateConversions)
      .where(and(
        eq(affiliateConversions.affiliateId, affiliateId),
        eq(affiliateConversions.status, status)
      ));
  }

  const conversions = await query.orderBy(desc(affiliateConversions.createdAt));

  const result = [];
  for (const conv of conversions) {
    const [user] = await db.select().from(users).where(eq(users.id, conv.userId));
    result.push({
      ...conv,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        kycStatus: user.kycStatus,
      } : {},
    });
  }

  return result;
}

export async function getAffiliatePayouts(affiliateId: string): Promise<AffiliatePayout[]> {
  return await db
    .select()
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.affiliateId, affiliateId))
    .orderBy(desc(affiliatePayouts.createdAt));
}

export async function requestAffiliatePayout(
  affiliateId: string,
  amount: number,
  pixKey: string,
  pixKeyType: string
): Promise<AffiliatePayout> {
  const [affiliate] = await db
    .select()
    .from(affiliates)
    .where(eq(affiliates.id, affiliateId));

  if (!affiliate) {
    throw new Error("Afiliado não encontrado");
  }

  const pendingBalance = parseFloat(affiliate.pendingBalance);
  
  if (amount > pendingBalance) {
    throw new Error(`Saldo insuficiente. Disponível: R$ ${pendingBalance.toFixed(2)}`);
  }

  if (amount < 50) {
    throw new Error("Valor mínimo para saque é R$ 50,00");
  }

  const [payout] = await db
    .insert(affiliatePayouts)
    .values({
      affiliateId,
      amount: amount.toFixed(2),
      pixKey,
      pixKeyType,
      status: PayoutStatus.PENDING,
    })
    .returning();

  return payout;
}

export async function approveAffiliatePayout(
  payoutId: string,
  adminId: string
): Promise<void> {
  const [payout] = await db
    .select()
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.id, payoutId));

  if (!payout) {
    throw new Error("Pagamento não encontrado");
  }

  if (payout.status !== PayoutStatus.PENDING) {
    throw new Error("Pagamento não está pendente");
  }

  await db
    .update(affiliatePayouts)
    .set({
      status: PayoutStatus.APPROVED,
      approvedBy: adminId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(affiliatePayouts.id, payoutId));

  await db.insert(adminAuditLogs).values({
    adminId,
    action: AdminAction.AFFILIATE_PAYOUT_APPROVE,
    targetType: "AFFILIATE_PAYOUT",
    targetId: payoutId,
    dataAfter: JSON.stringify({ status: "APPROVED" }),
  });
}

export async function markPayoutAsPaid(
  payoutId: string,
  adminId: string
): Promise<void> {
  const [payout] = await db
    .select()
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.id, payoutId));

  if (!payout) {
    throw new Error("Pagamento não encontrado");
  }

  if (payout.status !== PayoutStatus.APPROVED) {
    throw new Error("Pagamento precisa estar aprovado");
  }

  const amount = parseFloat(payout.amount);

  await db
    .update(affiliates)
    .set({
      pendingBalance: sql`${affiliates.pendingBalance} - ${amount}`,
      paidBalance: sql`${affiliates.paidBalance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, payout.affiliateId));

  await db
    .update(affiliatePayouts)
    .set({
      status: PayoutStatus.PAID,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(affiliatePayouts.id, payoutId));

  await db.insert(adminAuditLogs).values({
    adminId,
    action: AdminAction.AFFILIATE_PAYOUT_PAY,
    targetType: "AFFILIATE_PAYOUT",
    targetId: payoutId,
    dataAfter: JSON.stringify({ status: "PAID", amount: payout.amount }),
  });
}

export async function getAffiliateDashboardStats(affiliateId: string): Promise<{
  totalReferrals: number;
  qualifiedReferrals: number;
  pendingBalance: number;
  paidBalance: number;
  totalEarnings: number;
  conversionRate: number;
}> {
  const [affiliate] = await db
    .select()
    .from(affiliates)
    .where(eq(affiliates.id, affiliateId));

  if (!affiliate) {
    throw new Error("Afiliado não encontrado");
  }

  const totalReferrals = parseInt(affiliate.totalReferrals);
  const qualifiedReferrals = parseInt(affiliate.qualifiedReferrals);

  return {
    totalReferrals,
    qualifiedReferrals,
    pendingBalance: parseFloat(affiliate.pendingBalance),
    paidBalance: parseFloat(affiliate.paidBalance),
    totalEarnings: parseFloat(affiliate.totalEarnings),
    conversionRate: totalReferrals > 0 ? (qualifiedReferrals / totalReferrals) * 100 : 0,
  };
}

export async function toggleAffiliateStatus(
  affiliateId: string,
  adminId: string
): Promise<Affiliate> {
  const [affiliate] = await db
    .select()
    .from(affiliates)
    .where(eq(affiliates.id, affiliateId));

  if (!affiliate) {
    throw new Error("Afiliado não encontrado");
  }

  const newStatus = affiliate.status === AffiliateStatus.ACTIVE 
    ? AffiliateStatus.SUSPENDED 
    : AffiliateStatus.ACTIVE;

  const [updated] = await db
    .update(affiliates)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, affiliateId))
    .returning();

  await db.insert(adminAuditLogs).values({
    adminId,
    action: newStatus === AffiliateStatus.ACTIVE ? AdminAction.AFFILIATE_ACTIVATE : AdminAction.AFFILIATE_SUSPEND,
    targetType: "AFFILIATE",
    targetId: affiliateId,
    dataBefore: JSON.stringify({ status: affiliate.status }),
    dataAfter: JSON.stringify({ status: newStatus }),
  });

  return updated;
}
