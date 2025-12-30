import { db } from "../../db";
import { settings, adminAuditLogs, AdminAction, SettingsKey } from "@shared/schema";
import { eq } from "drizzle-orm";

const DEFAULT_MAX_AUTO_WITHDRAW = 500;
const DEFAULT_MATURATION_DAYS = 7;

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

export async function getSettingNumber(key: string, defaultValue: number): Promise<number> {
  const value = await getSetting(key);
  if (value === null) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
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

export async function getMaxAutoWithdrawAmount(): Promise<number> {
  return await getSettingNumber(SettingsKey.MAX_AUTO_WITHDRAW_AMOUNT, DEFAULT_MAX_AUTO_WITHDRAW);
}

export async function setMaxAutoWithdrawAmount(
  amount: number,
  adminId: string
): Promise<void> {
  await setSetting(
    SettingsKey.MAX_AUTO_WITHDRAW_AMOUNT,
    amount.toString(),
    adminId,
    "Valor máximo para saque PIX automático (em reais)"
  );
}

export async function getAffiliateMaturationDays(): Promise<number> {
  return await getSettingNumber(SettingsKey.AFFILIATE_MATURATION_DAYS, DEFAULT_MATURATION_DAYS);
}

export async function setAffiliateMaturationDays(
  days: number,
  adminId: string
): Promise<void> {
  await setSetting(
    SettingsKey.AFFILIATE_MATURATION_DAYS,
    days.toString(),
    adminId,
    "Dias de maturação para conversões de afiliados"
  );
}

export async function isRevShareRealPnlEnabled(): Promise<boolean> {
  return await getSettingBoolean(SettingsKey.REVSHARE_USE_REAL_PNL);
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

  const maxAutoWithdraw = await getSetting(SettingsKey.MAX_AUTO_WITHDRAW_AMOUNT);
  if (maxAutoWithdraw === null) {
    await db.insert(settings).values({
      key: SettingsKey.MAX_AUTO_WITHDRAW_AMOUNT,
      value: DEFAULT_MAX_AUTO_WITHDRAW.toString(),
      description: "Valor máximo para saque PIX automático (em reais)",
    });
    console.log(`[Settings] Initialized MAX_AUTO_WITHDRAW_AMOUNT = ${DEFAULT_MAX_AUTO_WITHDRAW}`);
  }

  const maturationDays = await getSetting(SettingsKey.AFFILIATE_MATURATION_DAYS);
  if (maturationDays === null) {
    await db.insert(settings).values({
      key: SettingsKey.AFFILIATE_MATURATION_DAYS,
      value: DEFAULT_MATURATION_DAYS.toString(),
      description: "Dias de maturação para conversões de afiliados",
    });
    console.log(`[Settings] Initialized AFFILIATE_MATURATION_DAYS = ${DEFAULT_MATURATION_DAYS}`);
  }

  const revShareRealPnl = await getSetting(SettingsKey.REVSHARE_USE_REAL_PNL);
  if (revShareRealPnl === null) {
    await db.insert(settings).values({
      key: SettingsKey.REVSHARE_USE_REAL_PNL,
      value: "false",
      description: "Usar P&L real para cálculo de RevShare (desligado = 5% fixo)",
    });
    console.log("[Settings] Initialized REVSHARE_USE_REAL_PNL = false");
  }
}
