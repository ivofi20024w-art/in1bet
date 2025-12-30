import { db } from "../../db";
import {
  supportDepartments,
  adminDepartments,
  users,
  supportSlaRules,
  supportTriageRules,
  supportCannedResponses,
  supportAuditLogs,
  type SupportDepartment,
  type AdminDepartment,
  type CreateSupportDepartment,
  type UpdateSupportDepartment,
  type AssignAdminToDepartment,
  type CreateSlaRule,
  type CreateTriageRule,
  type CreateCannedResponse,
  SupportAgentRole,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface DepartmentResult {
  success: boolean;
  department?: SupportDepartment;
  error?: string;
}

export interface AdminDepartmentResult {
  success: boolean;
  adminDepartment?: AdminDepartment;
  error?: string;
}

export async function createDepartment(
  data: CreateSupportDepartment,
  createdBy?: string
): Promise<DepartmentResult> {
  try {
    const [department] = await db
      .insert(supportDepartments)
      .values({
        name: data.name,
        description: data.description || null,
        isActive: data.isActive ?? true,
        priorityWeight: String(data.priorityWeight ?? 1),
        workingHours: data.workingHours ? JSON.stringify(data.workingHours) : null,
        autoAssign: data.autoAssign ?? true,
        maxQueueSize: String(data.maxQueueSize ?? 50),
      })
      .returning();

    if (createdBy) {
      await db.insert(supportAuditLogs).values({
        entityType: "DEPARTMENT",
        entityId: department.id,
        action: "CREATED",
        adminId: createdBy,
        dataAfter: JSON.stringify(department),
      });
    }

    console.log(`[SUPPORT] Department created: ${department.id} - ${department.name}`);
    return { success: true, department };
  } catch (error: any) {
    console.error("Create department error:", error);
    if (error.code === "23505") {
      return { success: false, error: "Departamento com esse nome já existe" };
    }
    return { success: false, error: "Erro ao criar departamento" };
  }
}

export async function updateDepartment(
  departmentId: string,
  data: UpdateSupportDepartment,
  updatedBy?: string
): Promise<DepartmentResult> {
  try {
    const [existing] = await db
      .select()
      .from(supportDepartments)
      .where(eq(supportDepartments.id, departmentId));

    if (!existing) {
      return { success: false, error: "Departamento não encontrado" };
    }

    const updateData: any = { updatedAt: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.priorityWeight !== undefined) updateData.priorityWeight = String(data.priorityWeight);
    if (data.workingHours !== undefined) updateData.workingHours = JSON.stringify(data.workingHours);
    if (data.autoAssign !== undefined) updateData.autoAssign = data.autoAssign;
    if (data.maxQueueSize !== undefined) updateData.maxQueueSize = String(data.maxQueueSize);

    const [department] = await db
      .update(supportDepartments)
      .set(updateData)
      .where(eq(supportDepartments.id, departmentId))
      .returning();

    if (updatedBy) {
      await db.insert(supportAuditLogs).values({
        entityType: "DEPARTMENT",
        entityId: department.id,
        action: "UPDATED",
        adminId: updatedBy,
        dataBefore: JSON.stringify(existing),
        dataAfter: JSON.stringify(department),
      });
    }

    return { success: true, department };
  } catch (error: any) {
    console.error("Update department error:", error);
    return { success: false, error: "Erro ao atualizar departamento" };
  }
}

export async function getDepartmentById(departmentId: string): Promise<SupportDepartment | null> {
  const [department] = await db
    .select()
    .from(supportDepartments)
    .where(eq(supportDepartments.id, departmentId));
  return department || null;
}

export async function getAllDepartments(includeInactive = false): Promise<SupportDepartment[]> {
  if (includeInactive) {
    return await db.select().from(supportDepartments).orderBy(desc(supportDepartments.priorityWeight));
  }
  return await db
    .select()
    .from(supportDepartments)
    .where(eq(supportDepartments.isActive, true))
    .orderBy(desc(supportDepartments.priorityWeight));
}

export async function toggleDepartmentStatus(
  departmentId: string,
  adminId: string
): Promise<DepartmentResult> {
  try {
    const department = await getDepartmentById(departmentId);
    if (!department) {
      return { success: false, error: "Departamento não encontrado" };
    }

    const [updated] = await db
      .update(supportDepartments)
      .set({ isActive: !department.isActive, updatedAt: new Date() })
      .where(eq(supportDepartments.id, departmentId))
      .returning();

    await db.insert(supportAuditLogs).values({
      entityType: "DEPARTMENT",
      entityId: departmentId,
      action: updated.isActive ? "ACTIVATED" : "DEACTIVATED",
      adminId,
      dataBefore: JSON.stringify({ isActive: department.isActive }),
      dataAfter: JSON.stringify({ isActive: updated.isActive }),
    });

    return { success: true, department: updated };
  } catch (error: any) {
    console.error("Toggle department error:", error);
    return { success: false, error: "Erro ao alterar status do departamento" };
  }
}

export async function assignAdminToDepartment(
  data: AssignAdminToDepartment,
  assignedBy?: string
): Promise<AdminDepartmentResult> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, data.adminId));
    if (!user || !user.isAdmin) {
      return { success: false, error: "Usuário não é um administrador" };
    }

    const department = await getDepartmentById(data.departmentId);
    if (!department) {
      return { success: false, error: "Departamento não encontrado" };
    }

    const [existing] = await db
      .select()
      .from(adminDepartments)
      .where(
        and(
          eq(adminDepartments.adminId, data.adminId),
          eq(adminDepartments.departmentId, data.departmentId)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(adminDepartments)
        .set({
          role: data.role || existing.role,
          maxConcurrentChats: String(data.maxConcurrentChats ?? parseInt(existing.maxConcurrentChats)),
          updatedAt: new Date(),
        })
        .where(eq(adminDepartments.id, existing.id))
        .returning();

      return { success: true, adminDepartment: updated };
    }

    const [adminDepartment] = await db
      .insert(adminDepartments)
      .values({
        adminId: data.adminId,
        departmentId: data.departmentId,
        role: data.role || SupportAgentRole.JUNIOR,
        maxConcurrentChats: String(data.maxConcurrentChats ?? 5),
      })
      .returning();

    if (assignedBy) {
      await db.insert(supportAuditLogs).values({
        entityType: "AGENT",
        entityId: adminDepartment.id,
        action: "ASSIGNED_TO_DEPARTMENT",
        adminId: assignedBy,
        dataAfter: JSON.stringify(adminDepartment),
      });
    }

    console.log(`[SUPPORT] Admin ${data.adminId} assigned to department ${data.departmentId}`);
    return { success: true, adminDepartment };
  } catch (error: any) {
    console.error("Assign admin to department error:", error);
    return { success: false, error: "Erro ao vincular agente ao departamento" };
  }
}

export async function removeAdminFromDepartment(
  adminId: string,
  departmentId: string,
  removedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [existing] = await db
      .select()
      .from(adminDepartments)
      .where(
        and(
          eq(adminDepartments.adminId, adminId),
          eq(adminDepartments.departmentId, departmentId)
        )
      );

    if (!existing) {
      return { success: false, error: "Vínculo não encontrado" };
    }

    await db
      .delete(adminDepartments)
      .where(eq(adminDepartments.id, existing.id));

    if (removedBy) {
      await db.insert(supportAuditLogs).values({
        entityType: "AGENT",
        entityId: existing.id,
        action: "REMOVED_FROM_DEPARTMENT",
        adminId: removedBy,
        dataBefore: JSON.stringify(existing),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Remove admin from department error:", error);
    return { success: false, error: "Erro ao remover agente do departamento" };
  }
}

export async function getAdminDepartments(adminId: string): Promise<AdminDepartment[]> {
  return await db
    .select()
    .from(adminDepartments)
    .where(eq(adminDepartments.adminId, adminId));
}

export async function getDepartmentAgents(departmentId: string): Promise<any[]> {
  const agents = await db
    .select({
      id: adminDepartments.id,
      adminId: adminDepartments.adminId,
      role: adminDepartments.role,
      maxConcurrentChats: adminDepartments.maxConcurrentChats,
      isAvailable: adminDepartments.isAvailable,
      lastActiveAt: adminDepartments.lastActiveAt,
      adminName: users.name,
      adminEmail: users.email,
    })
    .from(adminDepartments)
    .leftJoin(users, eq(adminDepartments.adminId, users.id))
    .where(eq(adminDepartments.departmentId, departmentId));

  return agents;
}

export async function updateAgentAvailability(
  adminId: string,
  departmentId: string,
  isAvailable: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(adminDepartments)
      .set({
        isAvailable,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(adminDepartments.adminId, adminId),
          eq(adminDepartments.departmentId, departmentId)
        )
      );

    return { success: true };
  } catch (error: any) {
    console.error("Update agent availability error:", error);
    return { success: false, error: "Erro ao atualizar disponibilidade" };
  }
}

export async function createSlaRule(
  data: CreateSlaRule,
  createdBy?: string
): Promise<{ success: boolean; slaRule?: any; error?: string }> {
  try {
    const [slaRule] = await db
      .insert(supportSlaRules)
      .values({
        name: data.name,
        departmentId: data.departmentId || null,
        priority: data.priority,
        firstResponseMinutes: String(data.firstResponseMinutes),
        resolutionMinutes: String(data.resolutionMinutes),
        escalateAfterMinutes: data.escalateAfterMinutes ? String(data.escalateAfterMinutes) : null,
      })
      .returning();

    if (createdBy) {
      await db.insert(supportAuditLogs).values({
        entityType: "SLA_RULE",
        entityId: slaRule.id,
        action: "CREATED",
        adminId: createdBy,
        dataAfter: JSON.stringify(slaRule),
      });
    }

    return { success: true, slaRule };
  } catch (error: any) {
    console.error("Create SLA rule error:", error);
    return { success: false, error: "Erro ao criar regra SLA" };
  }
}

export async function getSlaRules(departmentId?: string): Promise<any[]> {
  if (departmentId) {
    return await db
      .select()
      .from(supportSlaRules)
      .where(eq(supportSlaRules.departmentId, departmentId));
  }
  return await db.select().from(supportSlaRules);
}

export async function createTriageRule(
  data: CreateTriageRule,
  createdBy?: string
): Promise<{ success: boolean; triageRule?: any; error?: string }> {
  try {
    const [triageRule] = await db
      .insert(supportTriageRules)
      .values({
        name: data.name,
        keywords: JSON.stringify(data.keywords),
        category: data.category,
        departmentId: data.departmentId || null,
        priority: data.priority || "NORMAL",
        autoResponse: data.autoResponse || null,
        canAutoResolve: data.canAutoResolve || false,
        priorityOrder: String(data.priorityOrder ?? 100),
      })
      .returning();

    if (createdBy) {
      await db.insert(supportAuditLogs).values({
        entityType: "TRIAGE_RULE",
        entityId: triageRule.id,
        action: "CREATED",
        adminId: createdBy,
        dataAfter: JSON.stringify(triageRule),
      });
    }

    return { success: true, triageRule };
  } catch (error: any) {
    console.error("Create triage rule error:", error);
    return { success: false, error: "Erro ao criar regra de triagem" };
  }
}

export async function getTriageRules(activeOnly = true): Promise<any[]> {
  if (activeOnly) {
    return await db
      .select()
      .from(supportTriageRules)
      .where(eq(supportTriageRules.isActive, true))
      .orderBy(supportTriageRules.priorityOrder);
  }
  return await db.select().from(supportTriageRules).orderBy(supportTriageRules.priorityOrder);
}

export async function createCannedResponse(
  data: CreateCannedResponse,
  createdBy: string
): Promise<{ success: boolean; cannedResponse?: any; error?: string }> {
  try {
    const [cannedResponse] = await db
      .insert(supportCannedResponses)
      .values({
        title: data.title,
        content: data.content,
        departmentId: data.departmentId || null,
        category: data.category || null,
        shortcut: data.shortcut || null,
        createdBy,
      })
      .returning();

    return { success: true, cannedResponse };
  } catch (error: any) {
    console.error("Create canned response error:", error);
    return { success: false, error: "Erro ao criar resposta pré-definida" };
  }
}

export async function getCannedResponses(departmentId?: string): Promise<any[]> {
  if (departmentId) {
    return await db
      .select()
      .from(supportCannedResponses)
      .where(
        and(
          eq(supportCannedResponses.isActive, true),
          eq(supportCannedResponses.departmentId, departmentId)
        )
      );
  }
  return await db
    .select()
    .from(supportCannedResponses)
    .where(eq(supportCannedResponses.isActive, true));
}

export async function initializeDefaultDepartments(): Promise<void> {
  const defaultDepartments = [
    { name: "Financeiro", description: "Depósitos, saques e questões financeiras", priorityWeight: 10 },
    { name: "Suporte Técnico", description: "Problemas técnicos e bugs", priorityWeight: 5 },
    { name: "KYC/Verificação", description: "Verificação de documentos e conta", priorityWeight: 8 },
    { name: "Bônus e Promoções", description: "Dúvidas sobre bônus e promoções", priorityWeight: 3 },
    { name: "Jogos", description: "Suporte relacionado a jogos", priorityWeight: 4 },
    { name: "VIP", description: "Atendimento exclusivo para jogadores VIP", priorityWeight: 15 },
  ];

  for (const dept of defaultDepartments) {
    const existing = await db
      .select()
      .from(supportDepartments)
      .where(eq(supportDepartments.name, dept.name));

    if (existing.length === 0) {
      await createDepartment({
        name: dept.name,
        description: dept.description,
        priorityWeight: dept.priorityWeight,
        isActive: true,
        autoAssign: true,
        maxQueueSize: 50,
      });
    }
  }

  console.log("[SUPPORT] Default departments initialized");
}

export async function initializeDefaultSlaRules(): Promise<void> {
  const defaultRules = [
    { name: "SLA Normal", priority: "NORMAL", firstResponseMinutes: 30, resolutionMinutes: 240, escalateAfterMinutes: 60 },
    { name: "SLA Alta", priority: "HIGH", firstResponseMinutes: 15, resolutionMinutes: 120, escalateAfterMinutes: 30 },
    { name: "SLA Urgente", priority: "URGENT", firstResponseMinutes: 5, resolutionMinutes: 60, escalateAfterMinutes: 15 },
    { name: "SLA VIP", priority: "VIP", firstResponseMinutes: 2, resolutionMinutes: 30, escalateAfterMinutes: 10 },
    { name: "SLA Baixa", priority: "LOW", firstResponseMinutes: 60, resolutionMinutes: 480, escalateAfterMinutes: 120 },
  ];

  for (const rule of defaultRules) {
    const existing = await db
      .select()
      .from(supportSlaRules)
      .where(eq(supportSlaRules.name, rule.name));

    if (existing.length === 0) {
      await createSlaRule(rule as any);
    }
  }

  console.log("[SUPPORT] Default SLA rules initialized");
}

export async function initializeDefaultTriageRules(): Promise<void> {
  const defaultRules = [
    {
      name: "Saque",
      keywords: ["saque", "sacar", "retirada", "retirar", "pix", "transferência", "dinheiro"],
      category: "WITHDRAWAL",
      priority: "HIGH",
      autoResponse: "Entendi que você precisa de ajuda com saque. Um agente do departamento financeiro irá atendê-lo em breve.",
    },
    {
      name: "Depósito",
      keywords: ["depósito", "depositar", "carregar", "adicionar saldo", "pix não caiu"],
      category: "DEPOSIT",
      priority: "HIGH",
      autoResponse: "Entendi que você precisa de ajuda com depósito. Um agente do departamento financeiro irá atendê-lo em breve.",
    },
    {
      name: "KYC",
      keywords: ["kyc", "verificação", "documento", "selfie", "rg", "cnh", "validar conta"],
      category: "KYC",
      priority: "NORMAL",
      autoResponse: "Entendi que você precisa de ajuda com verificação de conta. Um agente irá atendê-lo em breve.",
    },
    {
      name: "Bônus",
      keywords: ["bônus", "bonus", "promoção", "rollover", "liberação"],
      category: "BONUS",
      priority: "NORMAL",
      autoResponse: "Entendi que você precisa de ajuda com bônus. Um agente irá atendê-lo em breve.",
    },
    {
      name: "Erro Técnico",
      keywords: ["erro", "bug", "travou", "não funciona", "problema", "caiu", "lento"],
      category: "TECHNICAL",
      priority: "HIGH",
      autoResponse: "Entendi que você está enfrentando um problema técnico. Um agente irá atendê-lo em breve.",
    },
    {
      name: "Conta",
      keywords: ["senha", "login", "email", "alterar dados", "bloquear", "excluir conta"],
      category: "ACCOUNT",
      priority: "NORMAL",
      autoResponse: "Entendi que você precisa de ajuda com sua conta. Um agente irá atendê-lo em breve.",
    },
  ];

  for (const rule of defaultRules) {
    const existing = await db
      .select()
      .from(supportTriageRules)
      .where(eq(supportTriageRules.name, rule.name));

    if (existing.length === 0) {
      await createTriageRule(rule as any);
    }
  }

  console.log("[SUPPORT] Default triage rules initialized");
}
