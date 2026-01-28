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
  
  if (!webhookSecret) {
    console.error("[SECURITY CRITICAL] ONDAPAY_WEBHOOK_SECRET not configured - rejecting all webhooks");
    return { valid: false, error: "Webhook secret not configured" };
  }

  const possibleHeaders = [
    "x-ondapay-signature",
    "x-signature", 
    "signature",
    "x-webhook-signature",
    "x-hmac-signature",
    "authorization",
  ];
  
  let signature: string | undefined;
  let foundHeader: string | undefined;
  for (const header of possibleHeaders) {
    const value = req.headers[header] as string;
    if (value) {
      foundHeader = header;
      signature = value.replace(/^(Bearer |sha256=|hmac=)/, "");
      console.log(`[WEBHOOK] Found signature in header '${header}': ${signature.substring(0, 20)}...`);
      break;
    }
  }
  
  if (!signature) {
    console.error("[SECURITY] Webhook rejected: No signature header found");
    console.log("[WEBHOOK] Available headers:", Object.keys(req.headers).join(", "));
    return { valid: false, error: "Missing signature header" };
  }

  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    console.error("[SECURITY] Webhook rejected: Raw body not available for signature verification");
    return { valid: false, error: "Raw body not available" };
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  console.log(`[WEBHOOK] Received signature (${signature.length} chars): ${signature.substring(0, 20)}...`);
  console.log(`[WEBHOOK] Expected signature (${expectedSignature.length} chars): ${expectedSignature.substring(0, 20)}...`);

  if (signature.length !== expectedSignature.length) {
    console.error(`[SECURITY] Webhook rejected: Signature length mismatch (received: ${signature.length}, expected: ${expectedSignature.length})`);
    return { valid: false, error: "Invalid signature" };
  }

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
    
    if (!isValid) {
      console.error("[SECURITY] Webhook rejected: Signature verification failed (signatures don't match)");
      return { valid: false, error: "Invalid signature" };
    }
    
    console.log("[WEBHOOK] Signature verified successfully!");
    return { valid: true };
  } catch (error) {
    console.error("[SECURITY] Webhook rejected: Signature verification error:", error);
    return { valid: false, error: "Signature verification error" };
  }
}

router.post("/webhook/ondapay", webhookLimiter, async (req: Request, res: Response) => {
  try {
    console.log("=== ONDAPAY WEBHOOK START ===");
    console.log("OndaPay webhook received at:", new Date().toISOString());
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("Raw body available:", !!(req as any).rawBody);
    console.log("ONDAPAY_WEBHOOK_SECRET configured:", !!process.env.ONDAPAY_WEBHOOK_SECRET);

    // DEBUG MODE: Skip signature verification temporarily to capture OndaPay's format
    const DEBUG_SKIP_SIGNATURE = process.env.ONDAPAY_DEBUG_MODE === "true";
    
    if (!DEBUG_SKIP_SIGNATURE) {
      const verificationResult = verifyWebhookSignature(req);
      if (!verificationResult.valid) {
        console.error("Webhook signature verification failed:", verificationResult.error);
        console.log("=== ONDAPAY WEBHOOK END (REJECTED) ===");
        return res.status(401).json({ error: verificationResult.error || "Invalid signature" });
      }
    } else {
      console.log("!!! DEBUG MODE: Skipping signature verification !!!");
    }

    console.log("Signature verified, processing payment...");
    const result = await processPixWebhook(req.body);

    if (result.success) {
      console.log("Payment processed successfully:", result.message);
      console.log("=== ONDAPAY WEBHOOK END (SUCCESS) ===");
      res.status(200).json({ received: true, message: result.message });
    } else {
      console.error("Payment processing failed:", result.message);
      console.log("=== ONDAPAY WEBHOOK END (FAILED) ===");
      res.status(400).json({ error: result.message });
    }
  } catch (error: any) {
    console.error("Error processing OndaPay webhook:", error);
    console.log("=== ONDAPAY WEBHOOK END (ERROR) ===");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
