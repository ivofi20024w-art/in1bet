import { db } from "../../db";
import { settings, adminAuditLogs, AdminAction, SettingsKey } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function getSetting(key: string): Promise<string | null> {
  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key));
  
  return setting?.value || null;
}

export async function getSettingBoolean(key: string): Promise<boolean> {
  const value = await getSetting(key);
  return value === "true";
}

export async function setSetting(
  key: string,
  value: string,
  adminId: string,
  description?: string
): Promise<void> {
  const [existing] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key));

  const previousValue = existing?.value || null;

  if (existing) {
    await db
      .update(settings)
      .set({
        value,
        description: description || existing.description,
        updatedBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({
      key,
      value,
      description,
      updatedBy: adminId,
    });
  }

  await db.insert(adminAuditLogs).values({
    adminId,
    action: AdminAction.SETTING_UPDATE,
    targetType: "SETTING",
    targetId: key,
    dataBefore: JSON.stringify({ value: previousValue }),
    dataAfter: JSON.stringify({ value }),
  });
}

export async function isAutoWithdrawGlobalEnabled(): Promise<boolean> {
  return await getSettingBoolean(SettingsKey.PIX_AUTO_WITHDRAW_GLOBAL);
}

export async function setAutoWithdrawGlobal(
  enabled: boolean,
  adminId: string
): Promise<void> {
  await setSetting(
    SettingsKey.PIX_AUTO_WITHDRAW_GLOBAL,
    enabled.toString(),
    adminId,
    "Habilita/desabilita saque PIX automático globalmente"
  );
}

export async function getAllSettings(): Promise<{ key: string; value: string; description: string | null; updatedAt: Date }[]> {
  const allSettings = await db.select().from(settings);
  return allSettings.map(s => ({
    key: s.key,
    value: s.value,
    description: s.description,
    updatedAt: s.updatedAt,
  }));
}

export async function initializeDefaultSettings(): Promise<void> {
  const globalAutoWithdraw = await getSetting(SettingsKey.PIX_AUTO_WITHDRAW_GLOBAL);
  if (globalAutoWithdraw === null) {
    await db.insert(settings).values({
      key: SettingsKey.PIX_AUTO_WITHDRAW_GLOBAL,
      value: "false",
      description: "Habilita/desabilita saque PIX automático globalmente",
    });
    console.log("[Settings] Initialized PIX_AUTO_WITHDRAW_GLOBAL = false");
  }
}
