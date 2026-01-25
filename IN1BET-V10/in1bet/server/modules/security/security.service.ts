import { db } from "../../db";
import {
  kycVerifications,
  securityLogs,
  users,
  wallets,
  pixDeposits,
  pixWithdrawals,
  userBonuses,
  KycVerificationStatus,
  SecurityAction,
  type KycVerification,
  type SecurityLog,
  type User,
} from "@shared/schema";
import { eq, desc, count, and, sum } from "drizzle-orm";

export interface KycVerificationWithUser extends KycVerification {
  user: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    phone: string | null;
    createdAt: Date;
    isBlocked: boolean;
  };
  stats?: {
    totalDeposits: number;
    totalWithdrawals: number;
    activeBonuses: number;
  };
}

export async function createKycVerification(
  userId: string,
  cpf: string,
  documentType: string,
  documentFrontUrl: string,
  documentBackUrl: string | null,
  selfieUrl: string
): Promise<KycVerification> {
  const [verification] = await db
    .insert(kycVerifications)
    .values({
      userId,
      cpf,
      documentType,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
    })
    .returning();

  return verification;
}

export async function getUserActiveKyc(userId: string): Promise<KycVerification | null> {
  const [verification] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.userId, userId))
    .orderBy(desc(kycVerifications.createdAt))
    .limit(1);

  return verification || null;
}

export async function getPendingKycVerifications(
  limit: number = 50
): Promise<KycVerificationWithUser[]> {
  const verifications = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.status, KycVerificationStatus.PENDING))
    .orderBy(desc(kycVerifications.createdAt))
    .limit(limit);

  return await enrichVerificationsWithUserData(verifications);
}

export async function getApprovedKycVerifications(
  limit: number = 50
): Promise<KycVerificationWithUser[]> {
  const verifications = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.status, KycVerificationStatus.APPROVED))
    .orderBy(desc(kycVerifications.reviewedAt))
    .limit(limit);

  return await enrichVerificationsWithUserData(verifications);
}

export async function getRejectedKycVerifications(
  limit: number = 50
): Promise<KycVerificationWithUser[]> {
  const verifications = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.status, KycVerificationStatus.REJECTED))
    .orderBy(desc(kycVerifications.reviewedAt))
    .limit(limit);

  return await enrichVerificationsWithUserData(verifications);
}

async function enrichVerificationsWithUserData(
  verifications: KycVerification[]
): Promise<KycVerificationWithUser[]> {
  const result: KycVerificationWithUser[] = [];

  for (const v of verifications) {
    const [user] = await db.select().from(users).where(eq(users.id, v.userId));

    if (user) {
      const [depositsSum] = await db
        .select({ total: sum(pixDeposits.amount) })
        .from(pixDeposits)
        .where(and(eq(pixDeposits.userId, v.userId), eq(pixDeposits.status, "COMPLETED")));

      const [withdrawalsSum] = await db
        .select({ total: sum(pixWithdrawals.amount) })
        .from(pixWithdrawals)
        .where(and(eq(pixWithdrawals.userId, v.userId), eq(pixWithdrawals.status, "PAID")));

      const [activeBonusCount] = await db
        .select({ count: count() })
        .from(userBonuses)
        .where(and(eq(userBonuses.userId, v.userId), eq(userBonuses.status, "ACTIVE")));

      result.push({
        ...v,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          phone: user.phone,
          createdAt: user.createdAt,
          isBlocked: user.isBlocked || false,
        },
        stats: {
          totalDeposits: parseFloat(depositsSum?.total || "0"),
          totalWithdrawals: parseFloat(withdrawalsSum?.total || "0"),
          activeBonuses: activeBonusCount?.count || 0,
        },
      });
    }
  }

  return result;
}

export async function getKycVerificationById(
  kycId: string
): Promise<KycVerificationWithUser | null> {
  const [verification] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.id, kycId));

  if (!verification) return null;

  const enriched = await enrichVerificationsWithUserData([verification]);
  return enriched[0] || null;
}

export async function approveKyc(
  kycId: string,
  adminId: string
): Promise<{ success: boolean; error?: string; verification?: KycVerification }> {
  const [verification] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.id, kycId));

  if (!verification) {
    return { success: false, error: "Verificação não encontrada" };
  }

  if (verification.status !== KycVerificationStatus.PENDING) {
    return { success: false, error: "Esta verificação não está pendente" };
  }

  const [updatedVerification] = await db
    .update(kycVerifications)
    .set({
      status: KycVerificationStatus.APPROVED,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    })
    .where(eq(kycVerifications.id, kycId))
    .returning();

  // Use transaction to ensure both updates succeed
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        kycStatus: "verified",
        isVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, verification.userId));

    await createSecurityLog({
      adminId,
      action: SecurityAction.KYC_APPROVE,
      targetType: "kyc_verification",
      targetId: kycId,
      userId: verification.userId,
      details: JSON.stringify({ documentType: verification.documentType }),
    });
  });

  console.log(`KYC approved: ${kycId} by admin ${adminId}`);

  return { success: true, verification: updatedVerification };
}

export async function rejectKyc(
  kycId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; error?: string; verification?: KycVerification }> {
  const [verification] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.id, kycId));

  if (!verification) {
    return { success: false, error: "Verificação não encontrada" };
  }

  if (verification.status !== KycVerificationStatus.PENDING) {
    return { success: false, error: "Esta verificação não está pendente" };
  }

  const [updatedVerification] = await db
    .update(kycVerifications)
    .set({
      status: KycVerificationStatus.REJECTED,
      rejectionReason: reason,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    })
    .where(eq(kycVerifications.id, kycId))
    .returning();

  await db
    .update(users)
    .set({
      kycStatus: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(users.id, verification.userId));

  await createSecurityLog({
    adminId,
    action: SecurityAction.KYC_REJECT,
    targetType: "kyc_verification",
    targetId: kycId,
    userId: verification.userId,
    reason,
    details: JSON.stringify({ documentType: verification.documentType }),
  });

  console.log(`KYC rejected: ${kycId} by admin ${adminId}, reason: ${reason}`);

  return { success: true, verification: updatedVerification };
}

export interface CreateSecurityLogParams {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  userId?: string;
  details?: string;
  reason?: string;
  ipAddress?: string;
}

export async function createSecurityLog(
  params: CreateSecurityLogParams
): Promise<SecurityLog> {
  const [log] = await db
    .insert(securityLogs)
    .values({
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      userId: params.userId,
      details: params.details,
      reason: params.reason,
      ipAddress: params.ipAddress,
    })
    .returning();

  return log;
}

export async function getSecurityLogs(limit: number = 100): Promise<(SecurityLog & { admin: User })[]> {
  const logs = await db
    .select()
    .from(securityLogs)
    .orderBy(desc(securityLogs.createdAt))
    .limit(limit);

  const result = [];
  for (const log of logs) {
    const [admin] = await db.select().from(users).where(eq(users.id, log.adminId));
    if (admin) {
      result.push({ ...log, admin });
    }
  }

  return result;
}

export async function getKycStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
}> {
  const [pendingCount] = await db
    .select({ count: count() })
    .from(kycVerifications)
    .where(eq(kycVerifications.status, KycVerificationStatus.PENDING));

  const [approvedCount] = await db
    .select({ count: count() })
    .from(kycVerifications)
    .where(eq(kycVerifications.status, KycVerificationStatus.APPROVED));

  const [rejectedCount] = await db
    .select({ count: count() })
    .from(kycVerifications)
    .where(eq(kycVerifications.status, KycVerificationStatus.REJECTED));

  return {
    pending: pendingCount?.count || 0,
    approved: approvedCount?.count || 0,
    rejected: rejectedCount?.count || 0,
  };
}
