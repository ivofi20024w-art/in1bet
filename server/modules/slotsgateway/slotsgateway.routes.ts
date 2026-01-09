import { Router, Request, Response } from "express";
import { slotsGatewayService } from "./slotsgateway.service";
import { authMiddleware } from "../auth/auth.middleware";
import { z } from "zod";

const router = Router();

router.get("/providers", async (req: Request, res: Response) => {
  try {
    const providers = await slotsGatewayService.getCachedProviders();
    res.json({ success: true, providers });
  } catch (error: any) {
    console.error("[SlotsGateway] Error fetching providers:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar provedores" });
  }
});

router.get("/games", async (req: Request, res: Response) => {
  try {
    const { providerId, gameType, search, limit } = req.query;
    
    const games = await slotsGatewayService.getCachedGames(
      providerId as string | undefined,
      gameType as string | undefined,
      search as string | undefined,
      limit ? parseInt(limit as string) : undefined
    );
    
    res.json({ success: true, data: games });
  } catch (error: any) {
    console.error("[SlotsGateway] Error fetching games:", error);
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

    const { idHash, homeUrl, cashierUrl } = parsed.data;

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
    const {
      action,
      player_id,
      amount,
      transaction_id,
      game_id,
      round_id,
    } = req.query;

    console.log("[SlotsGateway] Callback received:", {
      action,
      player_id,
      amount,
      transaction_id,
      game_id,
      round_id,
    });

    if (!player_id || !action) {
      return res.json({ error: 2, balance: 0 });
    }

    const result = await slotsGatewayService.handleBalanceCallback(
      player_id as string,
      action as string,
      amount ? parseInt(amount as string) : 0,
      transaction_id as string || `callback_${Date.now()}`,
      game_id as string | undefined,
      round_id as string | undefined
    );

    res.json(result);
  } catch (error: any) {
    console.error("[SlotsGateway] Callback error:", error);
    res.json({ error: 2, balance: 0 });
  }
});

router.post("/callback", async (req: Request, res: Response) => {
  try {
    const {
      action,
      player_id,
      amount,
      transaction_id,
      game_id,
      round_id,
    } = req.body;

    console.log("[SlotsGateway] POST Callback received:", req.body);

    if (!player_id || !action) {
      return res.json({ error: 2, balance: 0 });
    }

    const result = await slotsGatewayService.handleBalanceCallback(
      player_id,
      action,
      amount || 0,
      transaction_id || `callback_${Date.now()}`,
      game_id,
      round_id
    );

    res.json(result);
  } catch (error: any) {
    console.error("[SlotsGateway] POST Callback error:", error);
    res.json({ error: 2, balance: 0 });
  }
});

export default router;
