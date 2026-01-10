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
import { eq, and, desc, sum, count, gte, sql, lt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { 
  logAffiliatePayoutCreated, 
  logAffiliatePayoutReserved,
  logAffiliatePayoutReleased,
  logAffiliateFraudDetected 
} from "../../utils/operationalLog";
import { getAffiliateMaturationDays, isRevShareRealPnlEnabled } from "../settings/settings.service";

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
      userId: createdBy,
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
  const maturationDays = await getAffiliateMaturationDays();
  const maturesAt = new Date();
  maturesAt.setDate(maturesAt.getDate() + maturationDays);

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
      maturesAt,
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
  reason: string,
  affiliateId?: string,
  userId?: string
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

  if (affiliateId && userId) {
    logAffiliateFraudDetected(conversionId, affiliateId, userId, [reason]);
  }

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

async function calculateRealNetRevenue(userId: string, sinceDate?: Date): Promise<number> {
  let betQuery = db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, TransactionType.BET),
      sinceDate ? gte(transactions.createdAt, sinceDate) : sql`true`
    ));

  let winQuery = db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, TransactionType.WIN),
      sinceDate ? gte(transactions.createdAt, sinceDate) : sql`true`
    ));

  const [betSum] = await betQuery;
  const [winSum] = await winQuery;

  const totalBets = Math.abs(parseFloat(betSum?.total || "0"));
  const totalWins = Math.abs(parseFloat(winSum?.total || "0"));
  
  return Math.max(0, totalBets - totalWins);
}

export async function checkAndQualifyConversion(
  conversionId: string,
  adminId?: string,
  skipMaturationCheck: boolean = false
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

  if (!skipMaturationCheck && conversion.maturesAt) {
    const now = new Date();
    if (now < conversion.maturesAt) {
      const daysRemaining = Math.ceil((conversion.maturesAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { qualified: false, reason: `Período de maturação: ${daysRemaining} dias restantes` };
    }
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
    const useRealPnl = await isRevShareRealPnlEnabled();
    
    let netRevenue: number;
    if (useRealPnl) {
      netRevenue = await calculateRealNetRevenue(conversion.userId, conversion.createdAt);
    } else {
      netRevenue = wagerAmount * 0.05;
    }
    
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

  try {
    await db.transaction(async (tx) => {
      const [lockedConversion] = await tx
        .select()
        .from(affiliateConversions)
        .where(eq(affiliateConversions.id, conversionId))
        .for("update");

      if (!lockedConversion || lockedConversion.status !== ConversionStatus.PENDING) {
        throw new Error("Conversão já foi processada por outra requisição");
      }

      const [lockedAffiliate] = await tx
        .select()
        .from(affiliates)
        .where(eq(affiliates.id, conversion.affiliateId))
        .for("update");

      if (!lockedAffiliate) {
        throw new Error("Afiliado não encontrado durante atualização");
      }

      await tx
        .update(affiliateConversions)
        .set({
          status: ConversionStatus.APPROVED,
          commissionValue: commissionValue.toFixed(2),
          qualifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(affiliateConversions.id, conversionId));

      await tx
        .update(affiliates)
        .set({
          qualifiedReferrals: sql`${affiliates.qualifiedReferrals} + 1`,
          pendingBalance: sql`${affiliates.pendingBalance} + ${commissionValue}`,
          totalEarnings: sql`${affiliates.totalEarnings} + ${commissionValue}`,
          updatedAt: new Date(),
        })
        .where(eq(affiliates.id, conversion.affiliateId));

      if (conversion.affiliateLinkId) {
        await tx
          .update(affiliateLinks)
          .set({
            conversions: sql`${affiliateLinks.conversions} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(affiliateLinks.id, conversion.affiliateLinkId));
      }

      if (adminId) {
        await tx.insert(adminAuditLogs).values({
          adminId,
          action: AdminAction.AFFILIATE_CONVERSION_APPROVE,
          targetType: "AFFILIATE_CONVERSION",
          targetId: conversionId,
          dataAfter: JSON.stringify({ commissionValue, status: "APPROVED" }),
        });
      }
    });

    return { qualified: true };
  } catch (error: any) {
    if (error.message?.includes("já foi processada")) {
      return { qualified: false, reason: error.message };
    }
    throw error;
  }
}

export async function getMaturedPendingConversions(): Promise<AffiliateConversion[]> {
  const now = new Date();
  
  return await db
    .select()
    .from(affiliateConversions)
    .where(and(
      eq(affiliateConversions.status, ConversionStatus.PENDING),
      lt(affiliateConversions.maturesAt, now)
    ))
    .orderBy(affiliateConversions.createdAt);
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
  if (amount < 50) {
    throw new Error("Valor mínimo para saque é R$ 50,00");
  }

  const result = await db.transaction(async (tx) => {
    const [affiliate] = await tx
      .select()
      .from(affiliates)
      .where(eq(affiliates.id, affiliateId))
      .for("update");

    if (!affiliate) {
      throw new Error("Afiliado não encontrado");
    }

    const pendingBalance = parseFloat(affiliate.pendingBalance);
    const lockedBalance = parseFloat(affiliate.lockedBalance || "0");
    const availableBalance = pendingBalance - lockedBalance;
    
    if (amount > availableBalance) {
      throw new Error(`Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}`);
    }

    const newLockedBalance = lockedBalance + amount;
    
    await tx
      .update(affiliates)
      .set({
        lockedBalance: newLockedBalance.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, affiliateId));

    const [payout] = await tx
      .insert(affiliatePayouts)
      .values({
        affiliateId,
        amount: amount.toFixed(2),
        pixKey,
        pixKeyType,
        status: PayoutStatus.PENDING,
      })
      .returning();

    await tx.insert(adminAuditLogs).values({
      adminId: "SYSTEM_PAYOUT",
      action: AdminAction.AFFILIATE_PAYOUT_RESERVED,
      targetType: "AFFILIATE_PAYOUT",
      targetId: payout.id,
      dataAfter: JSON.stringify({ 
        affiliateId, 
        amount, 
        lockedBalance: newLockedBalance,
        previousLocked: lockedBalance 
      }),
    });

    return payout;
  });

  logAffiliatePayoutCreated(result.id, affiliateId, amount);
  logAffiliatePayoutReserved(result.id, affiliateId, amount);

  return result;
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
  await db.transaction(async (tx) => {
    const [payout] = await tx
      .select()
      .from(affiliatePayouts)
      .where(eq(affiliatePayouts.id, payoutId))
      .for("update");

    if (!payout) {
      throw new Error("Pagamento não encontrado");
    }

    if (payout.status !== PayoutStatus.APPROVED) {
      throw new Error("Pagamento precisa estar aprovado");
    }

    const amount = parseFloat(payout.amount);

    const [affiliate] = await tx
      .select()
      .from(affiliates)
      .where(eq(affiliates.id, payout.affiliateId))
      .for("update");

    if (!affiliate) {
      throw new Error("Afiliado não encontrado");
    }

    const lockedBalance = parseFloat(affiliate.lockedBalance || "0");
    const pendingBalance = parseFloat(affiliate.pendingBalance);
    const paidBalance = parseFloat(affiliate.paidBalance);

    await tx
      .update(affiliates)
      .set({
        pendingBalance: (pendingBalance - amount).toFixed(2),
        lockedBalance: Math.max(0, lockedBalance - amount).toFixed(2),
        paidBalance: (paidBalance + amount).toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, payout.affiliateId));

    await tx
      .update(affiliatePayouts)
      .set({
        status: PayoutStatus.PAID,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(affiliatePayouts.id, payoutId));

    await tx.insert(adminAuditLogs).values({
      adminId,
      action: AdminAction.AFFILIATE_PAYOUT_PAY,
      targetType: "AFFILIATE_PAYOUT",
      targetId: payoutId,
      dataAfter: JSON.stringify({ status: "PAID", amount: payout.amount }),
    });
  });
}

export async function rejectAffiliatePayout(
  payoutId: string,
  adminId: string,
  reason: string
): Promise<void> {
  await db.transaction(async (tx) => {
    const [payout] = await tx
      .select()
      .from(affiliatePayouts)
      .where(eq(affiliatePayouts.id, payoutId))
      .for("update");

    if (!payout) {
      throw new Error("Pagamento não encontrado");
    }

    if (payout.status !== PayoutStatus.PENDING && payout.status !== PayoutStatus.APPROVED) {
      throw new Error("Pagamento não pode ser rejeitado");
    }

    const amount = parseFloat(payout.amount);

    const [affiliate] = await tx
      .select()
      .from(affiliates)
      .where(eq(affiliates.id, payout.affiliateId))
      .for("update");

    if (!affiliate) {
      throw new Error("Afiliado não encontrado");
    }

    const lockedBalance = parseFloat(affiliate.lockedBalance || "0");
    const newLockedBalance = Math.max(0, lockedBalance - amount);

    await tx
      .update(affiliates)
      .set({
        lockedBalance: newLockedBalance.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, payout.affiliateId));

    await tx
      .update(affiliatePayouts)
      .set({
        status: PayoutStatus.REJECTED,
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(affiliatePayouts.id, payoutId));

    await tx.insert(adminAuditLogs).values({
      adminId,
      action: AdminAction.AFFILIATE_PAYOUT_RELEASED,
      targetType: "AFFILIATE_PAYOUT",
      targetId: payoutId,
      dataBefore: JSON.stringify({ lockedBalance }),
      dataAfter: JSON.stringify({ 
        status: "REJECTED", 
        reason, 
        releasedAmount: amount,
        newLockedBalance 
      }),
    });

    await tx.insert(adminAuditLogs).values({
      adminId,
      action: AdminAction.AFFILIATE_PAYOUT_REJECT,
      targetType: "AFFILIATE_PAYOUT",
      targetId: payoutId,
      dataAfter: JSON.stringify({ status: "REJECTED", reason }),
    });
  });

  const [payout] = await db
    .select()
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.id, payoutId));

  if (payout) {
    logAffiliatePayoutReleased(payoutId, payout.affiliateId, parseFloat(payout.amount), reason);
  }
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
