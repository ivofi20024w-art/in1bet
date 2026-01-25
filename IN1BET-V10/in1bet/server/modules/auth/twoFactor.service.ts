import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import crypto from "crypto";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

authenticator.options = {
  window: 2,
};

const APP_NAME = "IN1Bet";

export interface TwoFactorSetup {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

function hashBackupCodes(codes: string[]): string {
  return JSON.stringify(
    codes.map((code) => crypto.createHash("sha256").update(code).digest("hex"))
  );
}

function verifyBackupCode(code: string, hashedCodesJson: string): number {
  const hashedCodes: string[] = JSON.parse(hashedCodesJson);
  const inputHash = crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
  return hashedCodes.findIndex((h) => h === inputHash);
}

export async function generateTwoFactorSetup(
  userId: string,
  email: string
): Promise<TwoFactorSetup> {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, APP_NAME, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  const backupCodes = generateBackupCodes();

  return { secret, qrCodeDataUrl, backupCodes };
}

export async function enableTwoFactor(
  userId: string,
  secret: string,
  token: string,
  backupCodes: string[]
): Promise<{ success: boolean; error?: string }> {
  const isValid = authenticator.verify({ token, secret });
  if (!isValid) {
    return { success: false, error: "Código inválido. Tente novamente." };
  }

  const hashedBackupCodes = hashBackupCodes(backupCodes);

  await db
    .update(users)
    .set({
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: hashedBackupCodes,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function disableTwoFactor(
  userId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.twoFactorSecret) {
    return { success: false, error: "2FA não está ativado." };
  }

  const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
  if (!isValid) {
    return { success: false, error: "Código inválido. Tente novamente." };
  }

  await db
    .update(users)
    .set({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function verifyTwoFactorToken(
  userId: string,
  token: string
): Promise<{ success: boolean; error?: string; usedBackupCode?: boolean }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: "2FA não está ativado." };
  }

  const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
  if (isValid) {
    return { success: true };
  }

  if (user.twoFactorBackupCodes) {
    const backupIndex = verifyBackupCode(token, user.twoFactorBackupCodes);
    if (backupIndex !== -1) {
      const hashedCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
      hashedCodes.splice(backupIndex, 1);
      
      await db
        .update(users)
        .set({
          twoFactorBackupCodes: JSON.stringify(hashedCodes),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { success: true, usedBackupCode: true };
    }
  }

  return { success: false, error: "Código inválido." };
}

export async function regenerateBackupCodes(
  userId: string,
  token: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: "2FA não está ativado." };
  }

  const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
  if (!isValid) {
    return { success: false, error: "Código inválido." };
  }

  const newBackupCodes = generateBackupCodes();
  const hashedBackupCodes = hashBackupCodes(newBackupCodes);

  await db
    .update(users)
    .set({
      twoFactorBackupCodes: hashedBackupCodes,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true, backupCodes: newBackupCodes };
}

export async function getTwoFactorStatus(
  userId: string
): Promise<{ enabled: boolean; backupCodesRemaining: number }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return { enabled: false, backupCodesRemaining: 0 };
  }

  let backupCodesRemaining = 0;
  if (user.twoFactorBackupCodes) {
    try {
      const hashedCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
      backupCodesRemaining = hashedCodes.length;
    } catch {
      backupCodesRemaining = 0;
    }
  }

  return {
    enabled: user.twoFactorEnabled ?? false,
    backupCodesRemaining,
  };
}
