import { Router, Request, Response, NextFunction } from "express";
import { slotsGatewayService } from "./slotsgateway.service";
import { authMiddleware } from "../auth/auth.middleware";
import { z } from "zod";

const adminCheck = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: "Acesso não autorizado" });
    return;
  }
  next();
};

const router = Router();

router.get("/providers", async (req: Request, res: Response) => {
  try {
    const providers = await slotsGatewayService.getCachedProviders();
    res.json({ success: true, data: providers });
  } catch (error: any) {
    console.error("[SlotsGateway] Error fetching providers:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar provedores" });
  }
});

router.get("/games", async (req: Request, res: Response) => {
  try {
    const { providerId, gameType, type, search, limit, offset, isNew, hasJackpot } = req.query;
    const effectiveGameType = (gameType || type) as string | undefined;
    
    const result = await slotsGatewayService.getCachedGames(
      providerId as string | undefined,
      effectiveGameType,
      search as string | undefined,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined,
      isNew === 'true' ? true : undefined,
      hasJackpot === 'true' ? true : undefined
    );
    
    res.json({ 
      success: true, 
      data: result.games,
      total: result.total,
      hasMore: result.hasMore,
      limit: limit ? parseInt(limit as string) : result.games.length,
      offset: offset ? parseInt(offset as string) : 0
    });
  } catch (error: any) {
    console.error("[SlotsGateway] Error fetching games:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar jogos" });
  }
});

router.post("/games/by-ids", async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "IDs obrigatórios" });
    }
    
    const games = await slotsGatewayService.getGamesByIds(ids);
    res.json({ success: true, data: games });
  } catch (error: any) {
    console.error("[SlotsGateway] Error fetching games by IDs:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar jogos" });
  }
});

router.get("/games/:idHash", async (req: Request, res: Response) => {
  try {
    const { idHash } = req.params;
    const game = await slotsGatewayService.getGameByIdHash(idHash);
    
    if (!game) {
      return res.status(404).json({ error: "Jogo não encontrado" });
    }
    
    res.json({ game });
  } catch (error: any) {
    console.error("[SlotsGateway] Error fetching game:", error);
    res.status(500).json({ error: "Erro ao buscar jogo" });
  }
});

const launchGameSchema = z.object({
  idHash: z.string().min(1, "ID do jogo é obrigatório"),
  homeUrl: z.string().url().optional(),
  cashierUrl: z.string().url().optional(),
});

router.post("/launch", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    const parsed = launchGameSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { idHash } = parsed.data;
    
    const baseUrl = process.env.APP_URL || 'https://in1bet.com.br';
    
    const homeUrl = parsed.data.homeUrl || `${baseUrl}/`;
    const cashierUrl = parsed.data.cashierUrl || `${baseUrl}/wallet`;

    console.log(`[SlotsGateway] Launching game: ${idHash} for user: in1bet_${userId.substring(0, 8)}`);
    console.log(`[SlotsGateway] homeUrl: ${homeUrl}, cashierUrl: ${cashierUrl}`);

    const result = await slotsGatewayService.launchGame(
      userId,
      idHash,
      homeUrl,
      cashierUrl
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[SlotsGateway] Error launching game:", error);
    res.status(500).json({ success: false, error: error.message || "Erro ao iniciar jogo" });
  }
});

const launchDemoSchema = z.object({
  gameIdHash: z.string().min(1, "ID do jogo é obrigatório"),
  homeUrl: z.string().url().optional(),
});

router.post("/launch-demo", async (req: Request, res: Response) => {
  try {
    const parsed = launchDemoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { gameIdHash, homeUrl } = parsed.data;

    const result = await slotsGatewayService.launchDemoGame(gameIdHash, homeUrl);

    res.json(result);
  } catch (error: any) {
    console.error("[SlotsGateway] Error launching demo:", error);
    res.status(500).json({ error: error.message || "Erro ao iniciar demo" });
  }
});

router.post("/sync", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const games = await slotsGatewayService.syncGames("BRL");
    res.json({ message: `Sincronizados ${games.length} jogos`, count: games.length });
  } catch (error: any) {
    console.error("[SlotsGateway] Error syncing games:", error);
    res.status(500).json({ error: "Erro ao sincronizar jogos" });
  }
});

router.get("/callback", async (req: Request, res: Response) => {
  try {
    // Log all query params to debug what SlotsGateway sends
    console.log("[SlotsGateway] GET Callback - Full query params:", JSON.stringify(req.query));
    
    const {
      action,
      player_id,
      player,
      username,
      user,
      amount,
      transaction_id,
      tid,
      game_id,
      gameid,
      round_id,
      roundid,
    } = req.query;

    // Accept different field names for player
    const playerId = player_id || player || username || user;
    const txId = transaction_id || tid;
    const gameIdValue = game_id || gameid;
    const roundIdValue = round_id || roundid;

    console.log("[SlotsGateway] Callback received:", {
      action,
      playerId,
      amount,
      txId,
      gameIdValue,
      roundIdValue,
    });

    if (!playerId || !action) {
      console.log("[SlotsGateway] Missing playerId or action, returning error 2");
      return res.json({ error: 2, balance: 0 });
    }

    const result = await slotsGatewayService.handleBalanceCallback(
      playerId as string,
      action as string,
      amount ? parseInt(amount as string) : 0,
      (txId as string) || `callback_${Date.now()}`,
      gameIdValue as string | undefined,
      roundIdValue as string | undefined
    );

    res.json(result);
  } catch (error: any) {
    console.error("[SlotsGateway] Callback error:", error);
    res.json({ error: 2, balance: 0 });
  }
});

router.post("/callback", async (req: Request, res: Response) => {
  try {
    // Log full body to debug what SlotsGateway sends
    console.log("[SlotsGateway] POST Callback - Full body:", JSON.stringify(req.body));
    
    const {
      action,
      player_id,
      player,
      username,
      user,
      amount,
      transaction_id,
      tid,
      game_id,
      gameid,
      round_id,
      roundid,
    } = req.body;

    // Accept different field names for player
    const playerId = player_id || player || username || user;
    const txId = transaction_id || tid;
    const gameIdValue = game_id || gameid;
    const roundIdValue = round_id || roundid;

    console.log("[SlotsGateway] POST Callback received:", {
      action,
      playerId,
      amount,
      txId,
      gameIdValue,
      roundIdValue,
    });

    if (!playerId || !action) {
      console.log("[SlotsGateway] Missing playerId or action, returning error 2");
      return res.json({ error: 2, balance: 0 });
    }

    const result = await slotsGatewayService.handleBalanceCallback(
      playerId,
      action,
      amount || 0,
      txId || `callback_${Date.now()}`,
      gameIdValue,
      roundIdValue
    );

    res.json(result);
  } catch (error: any) {
    console.error("[SlotsGateway] POST Callback error:", error);
    res.json({ error: 2, balance: 0 });
  }
});

router.get("/debug", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    console.log("[SlotsGateway DEBUG] Starting debug check...");
    
    const envCheck = {
      SLOTSGATEWAY_API_LOGIN: process.env.SLOTSGATEWAY_API_LOGIN ? `SET (${process.env.SLOTSGATEWAY_API_LOGIN.substring(0, 8)}...)` : "NOT SET",
      SLOTSGATEWAY_API_PASSWORD: process.env.SLOTSGATEWAY_API_PASSWORD ? `SET (${process.env.SLOTSGATEWAY_API_PASSWORD.substring(0, 4)}...)` : "NOT SET",
      SLOTSGATEWAY_BASE_URL: process.env.SLOTSGATEWAY_BASE_URL || "NOT SET",
      SLOTSGATEWAY_SALT: process.env.SLOTSGATEWAY_SALT ? "SET" : "NOT SET",
      SLOTSGATEWAY_CALLBACK_URL: process.env.SLOTSGATEWAY_CALLBACK_URL || "NOT SET",
    };
    
    console.log("[SlotsGateway DEBUG] Environment variables:", JSON.stringify(envCheck, null, 2));
    
    const { games, total } = await slotsGatewayService.getCachedGames(undefined, undefined, undefined, 5);
    console.log(`[SlotsGateway DEBUG] Cached games in DB: ${total}`);
    
    let syncResult: any = null;
    let syncError: any = null;
    
    if (process.env.SLOTSGATEWAY_API_LOGIN && process.env.SLOTSGATEWAY_API_PASSWORD && process.env.SLOTSGATEWAY_BASE_URL) {
      try {
        console.log("[SlotsGateway DEBUG] Attempting to sync games from API...");
        const syncedGames = await slotsGatewayService.syncGames("BRL");
        syncResult = {
          success: true,
          gamesCount: syncedGames.length,
          sampleGames: syncedGames.slice(0, 3).map(g => ({ id: g.id, name: g.name, provider: g.providerSlug }))
        };
        console.log(`[SlotsGateway DEBUG] Sync successful: ${syncedGames.length} games`);
      } catch (err: any) {
        syncError = {
          message: err.message,
          stack: err.stack?.split('\n').slice(0, 5)
        };
        console.error("[SlotsGateway DEBUG] Sync failed:", err.message);
      }
    } else {
      syncError = { message: "API credentials not configured" };
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      cachedGames: {
        total,
        sample: games.slice(0, 3).map(g => ({ id: g.id, name: g.name }))
      },
      syncAttempt: syncResult || { error: syncError }
    });
  } catch (error: any) {
    console.error("[SlotsGateway DEBUG] Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
});

export default router;
