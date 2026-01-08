import { Router, Request, Response } from "express";
import { z } from "zod";
import { playfiversService } from "./playfivers.service";
import { PlayfiversApiError } from "./playfivers.client";
import { launchGameSchema, grantFreeRoundsSchema } from "@shared/schema";

const router = Router();

const balanceWebhookSchema = z.object({
  type: z.literal("BALANCE"),
  user_code: z.string(),
});

const transactionWebhookSchema = z.object({
  type: z.enum(["Bet", "WinBet", "Refund"]),
  agent_code: z.string(),
  agent_secret: z.string(),
  user_code: z.string(),
  user_balance: z.number().optional(),
  game_original: z.boolean().optional(),
  game_type: z.string().optional(),
  timestamp: z.number().optional(),
  slot: z.object({
    game_code: z.string().optional(),
    provider: z.string().optional(),
    bet: z.number().optional(),
    win: z.number().optional(),
    transaction_id: z.string(),
  }),
});

const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

function validateWebhookTimestamp(timestamp?: number): boolean {
  if (!timestamp) return true;
  const now = Date.now();
  const requestTime = timestamp * 1000;
  const diff = Math.abs(now - requestTime);
  return diff <= WEBHOOK_TIMESTAMP_TOLERANCE_MS;
}

router.get("/providers", async (req: Request, res: Response) => {
  try {
    const sync = req.query.sync === "true";
    
    const providers = sync 
      ? await playfiversService.syncProviders()
      : await playfiversService.getCachedProviders();

    res.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error("[PlayFivers] Error fetching providers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch providers",
    });
  }
});

router.get("/games", async (req: Request, res: Response) => {
  try {
    const providerId = req.query.providerId as string | undefined;
    const providerName = req.query.provider as string | undefined;
    const gameType = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;
    const namePatterns = req.query.namePatterns 
      ? (req.query.namePatterns as string).split(',').filter(Boolean)
      : undefined;
    const includeGameTypeInPatterns = req.query.includeGameType === "true";
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const sync = req.query.sync === "true";

    if (sync) {
      await playfiversService.syncGames(providerId);
    }

    const result = await playfiversService.getPaginatedGames({
      providerId,
      providerName,
      gameType,
      search,
      namePatterns,
      includeGameTypeInPatterns,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: result.games,
      total: result.total,
      hasMore: result.hasMore,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[PlayFivers] Error fetching games:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch games",
    });
  }
});

router.post("/launch", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const parsed = launchGameSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
    }

    const { gameCode, providerName, isOriginal, lang } = parsed.data;

    const result = await playfiversService.launchGame(
      userId,
      gameCode,
      providerName,
      isOriginal,
      lang
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[PlayFivers] Error launching game:", error);
    
    if (error instanceof PlayfiversApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to launch game",
    });
  }
});

router.post("/free-rounds", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const parsed = grantFreeRoundsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
    }

    const { gameCode, rounds } = parsed.data;

    const result = await playfiversService.grantFreeRounds(userId, gameCode, rounds);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[PlayFivers] Error granting free rounds:", error);
    
    if (error instanceof PlayfiversApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to grant free rounds",
    });
  }
});

router.get("/sessions", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const sessions = await playfiversService.getUserSessions(userId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("[PlayFivers] Error fetching sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch sessions",
    });
  }
});

router.get("/transactions", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await playfiversService.getTransactionHistory(userId, limit);

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("[PlayFivers] Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions",
    });
  }
});

router.get("/agent/info", async (req: Request, res: Response) => {
  try {
    const isAdmin = (req as any).user?.isAdmin;
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    const info = await playfiversService.getAgentInfo();

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error("[PlayFivers] Error fetching agent info:", error);
    
    if (error instanceof PlayfiversApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch agent info",
    });
  }
});

router.get("/agent/balances", async (req: Request, res: Response) => {
  try {
    const isAdmin = (req as any).user?.isAdmin;
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    const balances = await playfiversService.getAgentBalances();

    res.json({
      success: true,
      data: balances,
    });
  } catch (error) {
    console.error("[PlayFivers] Error fetching agent balances:", error);
    
    if (error instanceof PlayfiversApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch agent balances",
    });
  }
});

router.post("/webhook", async (req: Request, res: Response) => {
  console.log("[PlayFivers Webhook] Received:", JSON.stringify(req.body));

  try {
    if (req.body.type === "BALANCE") {
      const parsed = balanceWebhookSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error("[PlayFivers Webhook] Invalid balance request:", parsed.error);
        return res.status(400).json({ msg: "Invalid request", balance: 0 });
      }

      const { user_code } = parsed.data;
      const balance = await playfiversService.getUserBalance(user_code);

      return res.json({ msg: "", balance });
    }

    const parsed = transactionWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("[PlayFivers Webhook] Invalid transaction request:", parsed.error);
      return res.status(400).json({ msg: "Invalid request", balance: 0 });
    }

    const { type, agent_code, agent_secret, user_code, slot, timestamp } = parsed.data;

    if (!validateWebhookTimestamp(timestamp)) {
      console.error("[PlayFivers Webhook] Request timestamp too old or in future");
      return res.status(400).json({ msg: "Request expired", balance: 0 });
    }

    const expectedAgentCode = process.env.PLAYFIVERS_AGENT_CODE;
    const expectedAgentSecret = process.env.PLAYFIVERS_AGENT_SECRET;

    if (expectedAgentCode && expectedAgentSecret) {
      if (agent_code !== expectedAgentCode || agent_secret !== expectedAgentSecret) {
        console.error("[PlayFivers Webhook] Invalid agent credentials");
        return res.status(401).json({ msg: "Unauthorized", balance: 0 });
      }
    } else {
      console.warn("[PlayFivers Webhook] Agent credentials not configured - running in development mode");
    }

    const result = await playfiversService.processTransaction({
      type,
      userCode: user_code,
      agentCode: agent_code,
      agentSecret: agent_secret,
      slot,
    });

    return res.json(result);
  } catch (error) {
    console.error("[PlayFivers Webhook] Error:", error);

    if (error instanceof PlayfiversApiError) {
      if (error.statusCode === 400) {
        return res.status(400).json({ msg: error.message, balance: 0 });
      }
      if (error.statusCode === 404) {
        return res.status(404).json({ msg: "User not found", balance: 0 });
      }
    }

    return res.status(500).json({ msg: "Internal server error", balance: 0 });
  }
});

export default router;
