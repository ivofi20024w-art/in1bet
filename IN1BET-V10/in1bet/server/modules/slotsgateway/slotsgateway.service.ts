import { db } from "../../db";
import { 
  slotsgatewayProviders, 
  slotsgatewayGames, 
  slotsgatewayPlayers,
  slotsgatewayTransactions,
  wallets,
  transactions,
  users,
  TransactionType,
  TransactionStatus,
  SlotsgatewayTransactionType,
  SlotsgatewayTransactionStatus,
  type SlotsgatewayProvider,
  type SlotsgatewayGame,
  type SlotsgatewayPlayer,
  type SlotsgatewayTransaction,
} from "@shared/schema";
import { eq, desc, and, or, sql, like, ilike } from "drizzle-orm";
import { SlotsGatewayClient, SlotsGatewayApiError, type SlotsGatewayGame as ApiGame } from "./slotsgateway.client";
import crypto from "crypto";
import { addXpFromWager } from "../levels/level.service";
import { contributeToJackpot } from "../jackpot/jackpot.service";
import { broadcastCasinoWin } from "../chat/chat.websocket";
import { updateMissionProgress } from "../missions/mission.service";

const client = new SlotsGatewayClient();

export class SlotsGatewayService {
  async syncGames(currency: string = "BRL"): Promise<SlotsgatewayGame[]> {
    if (!client.isConfigured()) {
      console.warn("[SlotsGateway] API not configured, using cached data");
      const result = await this.getCachedGames();
      return result.games;
    }

    try {
      const apiGames = await client.getGameList(currency);
      
      const providersMap = new Map<string, string>();

      for (const game of apiGames) {
        let providerId = providersMap.get(game.category);
        
        if (!providerId) {
          const [provider] = await db
            .insert(slotsgatewayProviders)
            .values({
              slug: game.category,
              name: this.formatProviderName(game.category),
              imageUrl: null,
              status: "ACTIVE",
              lastSyncedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: slotsgatewayProviders.slug,
              set: {
                name: this.formatProviderName(game.category),
                lastSyncedAt: new Date(),
                updatedAt: new Date(),
              },
            })
            .returning();
          
          providerId = provider.id;
          providersMap.set(game.category, providerId);
        }

        await db
          .insert(slotsgatewayGames)
          .values({
            idHash: game.id_hash,
            name: game.name,
            imageUrl: game.image,
            imageSquare: game.image_square,
            imagePortrait: game.image_portrait,
            providerId: providerId,
            providerSlug: game.category,
            gameType: game.type || "video-slots",
            subcategory: game.subcategory,
            isMobile: game.mobile,
            isNew: game.new,
            hasJackpot: game.has_jackpot,
            supportsFreeRounds: game.freerounds_supported,
            supportsFeatureBuy: game.featurebuy_supported,
            supportsPlayForFun: game.play_for_fun_supported,
            currency: game.currency,
            status: "ACTIVE",
            lastSyncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: slotsgatewayGames.idHash,
            set: {
              name: game.name,
              imageUrl: game.image,
              imageSquare: game.image_square,
              imagePortrait: game.image_portrait,
              providerSlug: game.category,
              gameType: game.type || "video-slots",
              subcategory: game.subcategory,
              isMobile: game.mobile,
              isNew: game.new,
              hasJackpot: game.has_jackpot,
              supportsFreeRounds: game.freerounds_supported,
              supportsFeatureBuy: game.featurebuy_supported,
              supportsPlayForFun: game.play_for_fun_supported,
              currency: game.currency,
              lastSyncedAt: new Date(),
              updatedAt: new Date(),
            },
          });
      }

      console.log(`[SlotsGateway] Synced ${apiGames.length} games`);
      const result = await this.getCachedGames();
      return result.games;
    } catch (error) {
      console.error("[SlotsGateway] Failed to sync games:", error);
      const result = await this.getCachedGames();
      return result.games;
    }
  }

  private formatProviderName(slug: string): string {
    return slug
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  async getCachedProviders(): Promise<SlotsgatewayProvider[]> {
    const providers = await db
      .select()
      .from(slotsgatewayProviders)
      .where(eq(slotsgatewayProviders.status, "ACTIVE"))
      .orderBy(slotsgatewayProviders.name);
    
    return providers;
  }

  async getCachedGames(
    providerId?: string,
    gameType?: string,
    search?: string,
    limitCount?: number,
    offsetCount?: number
  ): Promise<{ games: SlotsgatewayGame[]; total: number; hasMore: boolean }> {
    const conditions = [eq(slotsgatewayGames.status, "ACTIVE")];

    if (providerId) {
      conditions.push(eq(slotsgatewayGames.providerId, providerId));
    }

    if (gameType) {
      conditions.push(eq(slotsgatewayGames.gameType, gameType));
    }

    if (search) {
      conditions.push(ilike(slotsgatewayGames.name, `%${search}%`));
    }

    // Get total count first
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(slotsgatewayGames)
      .where(and(...conditions));
    
    const total = countResult?.count || 0;

    let query = db
      .select()
      .from(slotsgatewayGames)
      .where(and(...conditions))
      .orderBy(desc(slotsgatewayGames.isNew), slotsgatewayGames.name);

    if (offsetCount) {
      query = query.offset(offsetCount) as typeof query;
    }

    if (limitCount) {
      query = query.limit(limitCount) as typeof query;
    }

    const games = await query;
    
    const currentOffset = offsetCount || 0;
    const currentLimit = limitCount || games.length;
    const hasMore = currentOffset + currentLimit < total;
    
    return { games, total, hasMore };
  }

  async getGameByIdHash(idHash: string): Promise<SlotsgatewayGame | null> {
    const [game] = await db
      .select()
      .from(slotsgatewayGames)
      .where(eq(slotsgatewayGames.idHash, idHash))
      .limit(1);
    
    return game || null;
  }

  async getOrCreatePlayer(userId: string): Promise<SlotsgatewayPlayer> {
    const [existingPlayer] = await db
      .select()
      .from(slotsgatewayPlayers)
      .where(eq(slotsgatewayPlayers.userId, userId))
      .limit(1);

    if (existingPlayer) {
      if (client.isConfigured()) {
        try {
          await client.createPlayer(existingPlayer.username, existingPlayer.password, "BRL");
        } catch (error: any) {
          if (!error.message?.includes("already exists")) {
            console.error("[SlotsGateway] Failed to ensure player exists in API:", error);
          }
        }
      }
      return existingPlayer;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const playerUsername = `in1bet_${userId.substring(0, 8)}`;
    const playerPassword = crypto.randomBytes(16).toString("hex");

    if (client.isConfigured()) {
      try {
        await client.createPlayer(playerUsername, playerPassword, "BRL");
      } catch (error: any) {
        if (!error.message?.includes("already exists")) {
          console.error("[SlotsGateway] Failed to create player in API:", error);
        }
      }
    }

    const [player] = await db
      .insert(slotsgatewayPlayers)
      .values({
        userId: userId,
        username: playerUsername,
        password: playerPassword,
        currency: "BRL",
        status: "ACTIVE",
      })
      .returning();

    return player;
  }

  async launchGame(
    userId: string,
    gameIdHash: string,
    homeUrl?: string,
    cashierUrl?: string
  ): Promise<{ launchUrl: string; sessionId: string }> {
    if (!client.isConfigured()) {
      throw new Error("SlotsGateway API não está configurada");
    }

    const player = await this.getOrCreatePlayer(userId);
    const game = await this.getGameByIdHash(gameIdHash);

    if (!game) {
      throw new Error("Jogo não encontrado");
    }

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) {
      throw new Error("Carteira não encontrada");
    }

    const response = await client.getGame(
      player.username,
      player.password,
      gameIdHash,
      "BRL",
      "pt",
      homeUrl,
      cashierUrl
    );

    if (!response.response || response.error !== 0) {
      throw new SlotsGatewayApiError(
        response.message || "Falha ao iniciar jogo",
        200,
        response.error
      );
    }

    return {
      launchUrl: response.response,
      sessionId: response.session_id || crypto.randomUUID(),
    };
  }

  async launchDemoGame(
    gameIdHash: string,
    homeUrl?: string
  ): Promise<{ launchUrl: string }> {
    if (!client.isConfigured()) {
      throw new Error("SlotsGateway API não está configurada");
    }

    const response = await client.getGameDemo(gameIdHash, "pt", homeUrl);

    if (!response.response || response.error !== 0) {
      throw new SlotsGatewayApiError(
        response.message || "Falha ao iniciar demo",
        200,
        response.error
      );
    }

    return {
      launchUrl: response.response,
    };
  }

  async handleBalanceCallback(
    playerUsername: string,
    action: string,
    amount: number,
    transactionId: string,
    gameId?: string,
    roundId?: string
  ): Promise<{ error: number; balance: number }> {
    const [player] = await db
      .select()
      .from(slotsgatewayPlayers)
      .where(eq(slotsgatewayPlayers.username, playerUsername))
      .limit(1);

    if (!player) {
      console.error(`[SlotsGateway] Player not found: ${playerUsername}`);
      return { error: 2, balance: 0 };
    }

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, player.userId))
      .limit(1);

    if (!wallet) {
      console.error(`[SlotsGateway] Wallet not found for user: ${player.userId}`);
      return { error: 2, balance: 0 };
    }

    const balanceInCents = Math.floor(parseFloat(wallet.balance) * 100);

    const [existingTx] = await db
      .select()
      .from(slotsgatewayTransactions)
      .where(eq(slotsgatewayTransactions.externalTransactionId, transactionId))
      .limit(1);

    if (existingTx) {
      console.log(`[SlotsGateway] Duplicate transaction: ${transactionId}`);
      return { error: 0, balance: balanceInCents };
    }

    if (action === "balance") {
      return { error: 0, balance: balanceInCents };
    }

    const amountDecimal = amount / 100;

    if (action === "bet" || action === "debit") {
      if (parseFloat(wallet.balance) < amountDecimal) {
        console.log(`[SlotsGateway] Insufficient balance for bet: ${amountDecimal}`);
        return { error: 1, balance: balanceInCents };
      }

      const newBalance = parseFloat(wallet.balance) - amountDecimal;

      await db.transaction(async (tx) => {
        await tx
          .update(wallets)
          .set({
            balance: newBalance.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id));

        const [walletTx] = await tx
          .insert(transactions)
          .values({
            userId: player.userId,
            walletId: wallet.id,
            type: TransactionType.BET,
            amount: amountDecimal.toFixed(2),
            balanceBefore: wallet.balance,
            balanceAfter: newBalance.toFixed(2),
            status: TransactionStatus.COMPLETED,
            description: `Aposta SlotsGateway - ${gameId || "Unknown"}`,
          })
          .returning();

        await tx
          .insert(slotsgatewayTransactions)
          .values({
            externalTransactionId: transactionId,
            userId: player.userId,
            playerId: player.id,
            transactionType: SlotsgatewayTransactionType.BET,
            gameIdHash: gameId,
            roundId: roundId,
            betAmount: amountDecimal.toFixed(2),
            winAmount: "0.00",
            balanceBefore: wallet.balance,
            balanceAfter: newBalance.toFixed(2),
            status: SlotsgatewayTransactionStatus.SUCCESS,
            walletTransactionId: walletTx.id,
          });
      });

      try {
        await addXpFromWager(player.userId, amountDecimal);
        await contributeToJackpot(player.userId, amountDecimal, "slots", transactionId);
        await updateMissionProgress(player.userId, "BET_COUNT", 1, transactionId);
        await updateMissionProgress(player.userId, "BET_AMOUNT", amountDecimal, transactionId);
      } catch (err) {
        console.error("[SlotsGateway] Error adding XP/Jackpot/Mission:", err);
      }

      const newBalanceInCents = Math.floor(newBalance * 100);
      return { error: 0, balance: newBalanceInCents };
    }

    if (action === "win" || action === "credit") {
      const newBalance = parseFloat(wallet.balance) + amountDecimal;

      await db.transaction(async (tx) => {
        await tx
          .update(wallets)
          .set({
            balance: newBalance.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id));

        const [walletTx] = await tx
          .insert(transactions)
          .values({
            userId: player.userId,
            walletId: wallet.id,
            type: TransactionType.WIN,
            amount: amountDecimal.toFixed(2),
            balanceBefore: wallet.balance,
            balanceAfter: newBalance.toFixed(2),
            status: TransactionStatus.COMPLETED,
            description: `Ganho SlotsGateway - ${gameId || "Unknown"}`,
          })
          .returning();

        await tx
          .insert(slotsgatewayTransactions)
          .values({
            externalTransactionId: transactionId,
            userId: player.userId,
            playerId: player.id,
            transactionType: SlotsgatewayTransactionType.WIN,
            gameIdHash: gameId,
            roundId: roundId,
            betAmount: "0.00",
            winAmount: amountDecimal.toFixed(2),
            balanceBefore: wallet.balance,
            balanceAfter: newBalance.toFixed(2),
            status: SlotsgatewayTransactionStatus.SUCCESS,
            walletTransactionId: walletTx.id,
          });
      });

      try {
        await updateMissionProgress(player.userId, "WIN_COUNT", 1, transactionId);
        await updateMissionProgress(player.userId, "WIN_AMOUNT", amountDecimal, transactionId);
      } catch (err) {
        console.error("[SlotsGateway] Error updating mission progress for win:", err);
      }

      if (amountDecimal >= 10) {
        try {
          const [userData] = await db.select().from(users).where(eq(users.id, player.userId)).limit(1);
          const game = gameId ? await this.getGameByIdHash(gameId as string) : null;
          const gameName = game?.name || "Slots";
          if (userData) {
            await broadcastCasinoWin(player.userId, userData.name, gameName, amountDecimal, userData.vipLevel || undefined, userData.level);
          }
        } catch (err) {
          console.error("[SlotsGateway] Error broadcasting casino win:", err);
        }
      }

      const newBalanceInCents = Math.floor(newBalance * 100);
      return { error: 0, balance: newBalanceInCents };
    }

    if (action === "refund" || action === "rollback") {
      const newBalance = parseFloat(wallet.balance) + amountDecimal;

      await db.transaction(async (tx) => {
        await tx
          .update(wallets)
          .set({
            balance: newBalance.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id));

        const [walletTx] = await tx
          .insert(transactions)
          .values({
            userId: player.userId,
            walletId: wallet.id,
            type: TransactionType.ROLLBACK,
            amount: amountDecimal.toFixed(2),
            balanceBefore: wallet.balance,
            balanceAfter: newBalance.toFixed(2),
            status: TransactionStatus.COMPLETED,
            description: `Reembolso SlotsGateway - ${gameId || "Unknown"}`,
          })
          .returning();

        await tx
          .insert(slotsgatewayTransactions)
          .values({
            externalTransactionId: transactionId,
            userId: player.userId,
            playerId: player.id,
            transactionType: SlotsgatewayTransactionType.REFUND,
            gameIdHash: gameId,
            roundId: roundId,
            betAmount: "0.00",
            winAmount: amountDecimal.toFixed(2),
            balanceBefore: wallet.balance,
            balanceAfter: newBalance.toFixed(2),
            status: SlotsgatewayTransactionStatus.SUCCESS,
            walletTransactionId: walletTx.id,
          });
      });

      const newBalanceInCents = Math.floor(newBalance * 100);
      return { error: 0, balance: newBalanceInCents };
    }

    console.error(`[SlotsGateway] Unknown action: ${action}`);
    return { error: 2, balance: 0 };
  }

  async grantFreeRounds(
    userId: string,
    gameIdHash: string,
    rounds: number
  ): Promise<void> {
    if (!client.isConfigured()) {
      throw new Error("SlotsGateway API não está configurada");
    }

    const player = await this.getOrCreatePlayer(userId);

    await client.addFreeRounds(player.username, gameIdHash, rounds, "BRL");
  }
}

export const slotsGatewayService = new SlotsGatewayService();

export async function initializeSlotsGateway(): Promise<void> {
  if (!client.isConfigured()) {
    console.log("[SlotsGateway] API not configured, skipping auto-sync");
    return;
  }

  try {
    console.log("[SlotsGateway] Initializing and syncing games...");
    const games = await slotsGatewayService.syncGames("BRL");
    console.log(`[SlotsGateway] Synced ${games.length} games successfully`);
  } catch (error) {
    console.error("[SlotsGateway] Failed to sync games on startup:", error);
  }
}
