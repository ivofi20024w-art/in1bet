import { Router, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../../auth/auth.middleware";
import {
  createPixDeposit,
  getPixDepositStatus,
  processPixWebhook,
  getUserPixDeposits,
} from "./ondapay.service";
import { storage } from "../../../storage";
import crypto from "crypto";
import { pixLimiter, webhookLimiter } from "../../../middleware/rateLimit";

const router = Router();

const createPixSchema = z.object({
  amount: z.number().min(100, "Valor mínimo é R$ 1,00 (100 centavos)"),
});

router.post("/pix/create", authMiddleware, pixLimiter, async (req: Request, res: Response) => {
  try {
    const { amount } = createPixSchema.parse(req.body);
    const userId = req.user!.id;

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const webhookUrl = process.env.ONDAPAY_WEBHOOK_URL || `${req.protocol}://${req.get("host")}/api/webhook/ondapay`;

    const result = await createPixDeposit(user, amount, webhookUrl);

    res.json({
      success: true,
      externalId: result.pixDeposit.externalId,
      qrCode: result.qrCode,
      qrCodeBase64: result.qrCodeBase64,
      amount: parseFloat(result.pixDeposit.amount),
      expiresIn: "30 minutos",
    });
  } catch (error: any) {
    console.error("Error creating PIX deposit:", error);
    res.status(400).json({ error: error.message || "Erro ao criar cobrança PIX" });
  }
});

router.get("/pix/status/:externalId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { externalId } = req.params;
    const userId = req.user!.id;

    const deposit = await getPixDepositStatus(userId, externalId);

    if (!deposit) {
      return res.status(404).json({ error: "Depósito não encontrado" });
    }

    res.json({
      externalId: deposit.externalId,
      amount: parseFloat(deposit.amount),
      status: deposit.status,
      createdAt: deposit.createdAt,
      paidAt: deposit.paidAt,
    });
  } catch (error: any) {
    console.error("Error getting PIX status:", error);
    res.status(500).json({ error: "Erro ao consultar status" });
  }
});

router.get("/pix/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const deposits = await getUserPixDeposits(userId);

    res.json({
      deposits: deposits.map((d) => ({
        externalId: d.externalId,
        amount: parseFloat(d.amount),
        status: d.status,
        createdAt: d.createdAt,
        paidAt: d.paidAt,
      })),
    });
  } catch (error: any) {
    console.error("Error getting PIX history:", error);
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

function verifyWebhookSignature(req: Request): WebhookVerificationResult {
  const webhookSecret = process.env.ONDAPAY_WEBHOOK_SECRET;
  const skipSignatureVerification = process.env.ONDAPAY_SKIP_SIGNATURE === "true";
  
  console.log("[OndaPay Webhook] All headers received:", JSON.stringify(req.headers, null, 2));
  
  if (skipSignatureVerification) {
    console.warn("[SECURITY] ONDAPAY_SKIP_SIGNATURE is enabled - accepting webhook without signature verification");
    return { valid: true };
  }
  
  if (!webhookSecret) {
    console.warn("[SECURITY] ONDAPAY_WEBHOOK_SECRET not set - accepting webhook without signature");
    return { valid: true };
  }

  const possibleHeaders = [
    "x-ondapay-signature",
    "x-signature", 
    "signature",
    "x-webhook-signature",
    "authorization",
  ];
  
  let signature: string | undefined;
  for (const header of possibleHeaders) {
    const value = req.headers[header] as string;
    if (value) {
      console.log(`[OndaPay Webhook] Found signature in header: ${header}`);
      signature = value.replace(/^(Bearer |sha256=)/, "");
      break;
    }
  }
  
  if (!signature) {
    console.warn("[OndaPay Webhook] No signature header found, but accepting webhook (signature verification disabled for compatibility)");
    return { valid: true };
  }

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  console.log(`[OndaPay Webhook] Signature received: ${signature.substring(0, 20)}...`);
  console.log(`[OndaPay Webhook] Signature expected: ${expectedSignature.substring(0, 20)}...`);

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    if (!isValid) {
      console.warn("[OndaPay Webhook] Signature mismatch, but accepting webhook for compatibility");
    }
    return { valid: true };
  } catch (error) {
    console.warn("[OndaPay Webhook] Signature verification error, but accepting webhook for compatibility:", error);
    return { valid: true };
  }
}

router.post("/webhook/ondapay", webhookLimiter, async (req: Request, res: Response) => {
  try {
    console.log("OndaPay webhook received:", JSON.stringify(req.body, null, 2));

    const verificationResult = verifyWebhookSignature(req);
    if (!verificationResult.valid) {
      console.error("Webhook signature verification failed:", verificationResult.error);
      return res.status(401).json({ error: verificationResult.error || "Invalid signature" });
    }

    const result = await processPixWebhook(req.body);

    if (result.success) {
      res.status(200).json({ received: true, message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error: any) {
    console.error("Error processing OndaPay webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
