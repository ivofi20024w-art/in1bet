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
  ];
  
  let signature: string | undefined;
  for (const header of possibleHeaders) {
    const value = req.headers[header] as string;
    if (value) {
      signature = value.replace(/^(Bearer |sha256=)/, "");
      break;
    }
  }
  
  if (!signature) {
    console.error("[SECURITY] Webhook rejected: No signature header found");
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

  if (signature.length !== expectedSignature.length) {
    console.error("[SECURITY] Webhook rejected: Signature length mismatch");
    return { valid: false, error: "Invalid signature" };
  }

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
    
    if (!isValid) {
      console.error("[SECURITY] Webhook rejected: Signature verification failed");
      return { valid: false, error: "Invalid signature" };
    }
    
    return { valid: true };
  } catch (error) {
    console.error("[SECURITY] Webhook rejected: Signature verification error:", error);
    return { valid: false, error: "Signature verification error" };
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
