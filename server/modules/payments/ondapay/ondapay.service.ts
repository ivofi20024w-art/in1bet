import { db } from "../../../db";
import { pixDeposits, type PixDeposit, type User, TransactionType } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { processBalanceChange } from "../../wallet/wallet.service";
import { sendNotificationToUser } from "../../notifications/notification.service";
import { randomUUID } from "crypto";

const ONDAPAY_BASE_URL = "https://api.ondapay.app/api/v1";

interface OndaPayLoginResponse {
  token: string;
}

interface OndaPayDepositResponse {
  status: number;
  id_transaction: string;
  qrcode: string;
  qrcode_base64: string;
}

interface OndaPayWebhookPayload {
  status: string;
  type_transaction: string;
  transaction_id: string;
  amount: number;
  net_amount: number;
  external_id: string;
  payer: {
    name: string;
    document: string;
    email?: string;
  };
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAuthToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now) {
    return cachedToken;
  }

  const clientId = process.env.ONDAPAY_CLIENT_ID;
  const clientSecret = process.env.ONDAPAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("ONDAPAY_CLIENT_ID and ONDAPAY_CLIENT_SECRET are required");
  }

  const response = await fetch(`${ONDAPAY_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "client_id": clientId,
      "client_secret": clientSecret,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OndaPay login failed:", errorText);
    throw new Error("Failed to authenticate with OndaPay");
  }

  const data: OndaPayLoginResponse = await response.json();
  cachedToken = data.token;
  tokenExpiry = now + 55 * 60 * 1000;
  
  return cachedToken;
}

export async function createPixDeposit(
  user: User,
  amountInCents: number,
  webhookUrl: string
): Promise<{ pixDeposit: PixDeposit; qrCode: string; qrCodeBase64: string }> {
  if (amountInCents < 100) {
    throw new Error("Valor mínimo para depósito é R$ 1,00");
  }

  const externalId = `DEP_${user.id}_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const amountFloat = amountInCents / 100;

  const [existingDeposit] = await db
    .select()
    .from(pixDeposits)
    .where(eq(pixDeposits.externalId, externalId));

  if (existingDeposit) {
    throw new Error("Depósito já em processamento");
  }

  const token = await getAuthToken();

  const cleanCpf = user.cpf.replace(/\D/g, "");

  const response = await fetch(`${ONDAPAY_BASE_URL}/deposit/pix`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: amountFloat,
      external_id: externalId,
      webhook: webhookUrl,
      description: `Depósito IN1Bet - ${user.name}`,
      payer: {
        document: cleanCpf,
        email: user.email,
        name: user.name,
      },
      dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 19).replace("T", " "),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OndaPay PIX creation failed:", errorText);
    throw new Error("Falha ao criar cobrança PIX");
  }

  const data: OndaPayDepositResponse = await response.json();

  const [pixDeposit] = await db
    .insert(pixDeposits)
    .values({
      userId: user.id,
      externalId,
      ondapayTransactionId: data.id_transaction,
      amount: amountFloat.toFixed(2),
      qrCode: data.qrcode,
      qrCodeBase64: data.qrcode_base64,
    })
    .returning();

  return {
    pixDeposit,
    qrCode: data.qrcode,
    qrCodeBase64: data.qrcode_base64,
  };
}

export async function getPixDepositStatus(
  userId: string,
  externalId: string
): Promise<PixDeposit | null> {
  const [deposit] = await db
    .select()
    .from(pixDeposits)
    .where(
      and(
        eq(pixDeposits.userId, userId),
        eq(pixDeposits.externalId, externalId)
      )
    );

  return deposit || null;
}

export async function getPixDepositByExternalId(
  externalId: string
): Promise<PixDeposit | null> {
  const [deposit] = await db
    .select()
    .from(pixDeposits)
    .where(eq(pixDeposits.externalId, externalId));

  return deposit || null;
}

export async function processPixWebhook(
  payload: OndaPayWebhookPayload
): Promise<{ success: boolean; message: string }> {
  const { status, external_id, amount, net_amount, type_transaction } = payload;

  if (type_transaction !== "CASH_IN") {
    return { success: false, message: "Invalid transaction type" };
  }

  if (status !== "PAID_OUT") {
    return { success: true, message: "Webhook received but payment not confirmed yet" };
  }

  const deposit = await getPixDepositByExternalId(external_id);

  if (!deposit) {
    console.error("PIX deposit not found for external_id:", external_id);
    return { success: false, message: "Deposit not found" };
  }

  if (deposit.status === "COMPLETED") {
    console.log("PIX deposit already processed (idempotency):", external_id);
    return { success: true, message: "Already processed" };
  }

  // Always credit the full amount the user deposited, not the net amount after fees
  // Fees are absorbed by the platform, not the user
  const creditAmount = amount;

  const referenceId = `PIX_${external_id}`;

  const result = await processBalanceChange(
    deposit.userId,
    creditAmount,
    TransactionType.DEPOSIT,
    `Depósito PIX via OndaPay - ${external_id}`,
    referenceId,
    { ondapayTransactionId: payload.transaction_id, externalId: external_id }
  );

  if (!result.success) {
    if (result.error === "Transação já processada") {
      await db
        .update(pixDeposits)
        .set({
          status: "COMPLETED",
          netAmount: creditAmount.toFixed(2),
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(pixDeposits.externalId, external_id));
      
      return { success: true, message: "Already processed via ledger" };
    }
    console.error("Failed to credit wallet:", result.error);
    return { success: false, message: result.error || "Failed to credit wallet" };
  }

  await db
    .update(pixDeposits)
    .set({
      status: "COMPLETED",
      netAmount: creditAmount.toFixed(2),
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pixDeposits.externalId, external_id));

  console.log(`PIX deposit completed: ${external_id}, credited R$ ${creditAmount}`);

  await sendNotificationToUser(deposit.userId, {
    type: "DEPOSIT",
    title: "Depósito Confirmado!",
    message: `Seu depósito de R$ ${creditAmount.toFixed(2)} foi confirmado e já está disponível na sua carteira.`,
    icon: "wallet",
    actionUrl: "/wallet",
    priority: "HIGH",
  }).catch(err => console.error("[Notification] Failed to send deposit notification:", err));

  return { success: true, message: "Payment processed successfully" };
}

export async function getUserPixDeposits(
  userId: string,
  limit: number = 20
): Promise<PixDeposit[]> {
  return await db
    .select()
    .from(pixDeposits)
    .where(eq(pixDeposits.userId, userId))
    .orderBy(pixDeposits.createdAt)
    .limit(limit);
}
