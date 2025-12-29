import { db } from "../../db";
import { adminAuditLogs, AdminAction } from "@shared/schema";

export type AdminActionType = typeof AdminAction[keyof typeof AdminAction];

export interface AuditLogParams {
  adminId: string;
  action: AdminActionType;
  targetType: "user" | "withdrawal" | "bonus" | "user_bonus";
  targetId: string;
  dataBefore?: any;
  dataAfter?: any;
  reason?: string;
  ipAddress?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await db.insert(adminAuditLogs).values({
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      dataBefore: params.dataBefore ? JSON.stringify(params.dataBefore) : null,
      dataAfter: params.dataAfter ? JSON.stringify(params.dataAfter) : null,
      reason: params.reason || null,
      ipAddress: params.ipAddress || null,
    });
    
    console.log(`[AUDIT] Admin ${params.adminId} performed ${params.action} on ${params.targetType}:${params.targetId}`);
  } catch (error) {
    console.error("[AUDIT] Failed to create audit log:", error);
  }
}

export async function getAuditLogs(limit: number = 100) {
  return await db
    .select()
    .from(adminAuditLogs)
    .orderBy(adminAuditLogs.createdAt)
    .limit(limit);
}
