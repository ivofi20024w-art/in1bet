import { db } from "../../db";
import { 
  playfiversProviders, 
  playfiversGames, 
  playfiversSessions,
  playfiversTransactions,
  wallets,
  transactions,
  users,
  TransactionType,
  TransactionStatus,
  PlayfiversTransactionType,
  PlayfiversTransactionStatus,
  type PlayfiversProvider,
  type PlayfiversGame,
  type PlayfiversSession,
  type PlayfiversTransaction,
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { PlayfiversClient, PlayfiversApiError } from "./playfivers.client";

const client = new PlayfiversClient();

const DEMO_PROVIDERS: Omit<PlayfiversProvider, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'>[] = [
  { externalId: "pgsoft", name: "PG Soft", imageUrl: "https://i.imgur.com/7QKsJyL.png", walletName: null, status: "ACTIVE" },
  { externalId: "pragmatic", name: "Pragmatic Play", imageUrl: "https://i.imgur.com/8QKsJyM.png", walletName: null, status: "ACTIVE" },
  { externalId: "evolution", name: "Evolution", imageUrl: "https://i.imgur.com/9QKsJyN.png", walletName: null, status: "ACTIVE" },
  { externalId: "spribe", name: "Spribe", imageUrl: "https://i.imgur.com/0QKsJyO.png", walletName: null, status: "ACTIVE" },
  { externalId: "hacksaw", name: "Hacksaw Gaming", imageUrl: "https://i.imgur.com/1QKsJyP.png", walletName: null, status: "ACTIVE" },
  { externalId: "nolimit", name: "NoLimit City", imageUrl: "https://i.imgur.com/2QKsJyQ.png", walletName: null, status: "ACTIVE" },
];

const DEMO_GAMES: Omit<PlayfiversGame, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'>[] = [
  { gameCode: "fortune-tiger", name: "Fortune Tiger", imageUrl: "https://www.pgsoft.com/images/games/110/image.webp", providerId: null, providerName: "PG Soft", isOriginal: false, supportsFreeRounds: false, gameType: "slot", status: "ACTIVE" },
  { gameCode: "fortune-ox", name: "Fortune Ox", imageUrl: "https://www.pgsoft.com/images/games/98/image.webp", providerId: null, providerName: "PG Soft", isOriginal: false, supportsFreeRounds: false, gameType: "slot", status: "ACTIVE" },
  { gameCode: "fortune-rabbit", name: "Fortune Rabbit", imageUrl: "https://www.pgsoft.com/images/games/1543462/image.webp", providerId: null, providerName: "PG Soft", isOriginal: false, supportsFreeRounds: false, gameType: "slot", status: "ACTIVE" },
  { gameCode: "fortune-mouse", name: "Fortune Mouse", imageUrl: "https://www.pgsoft.com/images/games/89/image.webp", providerId: null, providerName: "PG Soft", isOriginal: false, supportsFreeRounds: false, gameType: "slot", status: "ACTIVE" },
  { gameCode: "fortune-dragon", name: "Fortune Dragon", imageUrl: "https://www.pgsoft.com/images/games/1695365/image.webp", providerId: null, providerName: "PG Soft", isOriginal: false, supportsFreeRounds: false, gameType: "slot", status: "ACTIVE" },
  { gameCode: "ganesha-gold", name: "Ganesha Gold", imageUrl: "https://www.pgsoft.com/images/games/75/image.webp", providerId: null, providerName: "PG Soft", isOriginal: false, supportsFreeRounds: false, gameType: "slot", status: "ACTIVE" },
  { gameCode: "gates-of-olympus", name: "Gates of Olympus", imageUrl: "https://cdn.softswiss.net/i/s3/pragmaticexternal/vs20olympgate.png", providerId: null, providerName: "Pragmatic Play", isOriginal: false, supportsFreeRounds: true, gameType: "slot", status: "ACTIVE" },
  { gameCode: "sweet-bonanza", name: "Sweet Bonanza", imageUrl: "https://cdn.softswiss.net/i/s3/pragmaticexternal/vs20fruitsw.png", providerId: null, providerName: "Pragmatic Play", isOriginal: false, supportsFreeRounds: true, gameType: "slot", status: "ACTIVE" },
  { gameCode: "sugar-rush", name: "Sugar Rush", imageUrl: "https://cdn.softswiss.net/i/s3/pragmaticexternal/vs20sugarrush.png", providerId: null, providerName: "Pragmatic Play", isOriginal: false, supportsFreeRounds: true, gameType: "slot", status: "ACTIVE" },
  { gameCode: "big-bass-bonanza", name: "Big Bass Bonanza", imageUrl: "https://cdn.softswiss.net/i/s3/pragmaticexternal/vs10bbbonanza.png", providerId: null, providerName: "Pragmatic Play", isOriginal: false, supportsFreeRounds: true, gameType: "slot", status: "ACTIVE" },
  { gameCode: "starlight-princess", name: "Starlight Princess", imageUrl: "https://cdn.softswiss.net/i/s3/pragmaticexternal/vs20starlight.png", providerId: null, providerName: "Pragmatic Play", isOriginal: false, supportsFreeRounds: true, gameType: "slot", status: "ACTIVE" },
  { gameCode: "aztec-gems", name: "Aztec Gems", imageUrl: "https://cdn.softswiss.net/i/s3/pragmaticexternal/vs5aztecgems.png", providerId: null, providerName: "Pragmatic Play", isOriginal: false, supportsFreeRounds: false, gameType: "slot", status: "ACTIVE" },
  { gameCode: "big-bass-splash", name: "Big Bass Splash", imageUrl: "https://cdn.softswiss.net/i/s3/pragmaticexternal/vs12bbbsplash.png", providerId: null, providerName: "Pragmatic Play", isOriginal: false, supportsFreeRounds: true, gameType: "slot", status: "ACTIVE" },
  { gameCode: "the-dog-house", name: "The Dog House", imageUrl: "https://cdn.softswiss.net/i/s3/pragmaticexternal/vs20doghouse.png", providerId: null, providerName: "Pragmatic Play", isOriginal: false, supportsFreeRounds: true, gameType: "slot", status: "ACTIVE" },
  { gameCode: "fruit-party", name: "Fruit Party", imageUrl: "https://cdn.softswiss.net/i/s3/pragmaticexternal/vs20fruitparty.png", providerId: null, providerName: "Pragmatic Play", isOriginal: false, supportsFreeRounds: true, gameType: "slot", status: "ACTIVE" },
  { gameCode: "aviator", name: "Aviator", imageUrl: "https://cdn.softswiss.net/i/s3/spribe/aviator.png", providerId: null, providerName: "Spribe", isOriginal: false, supportsFreeRounds: false, gameType: "crash", status: "ACTIVE" },
  { gameCode: "spaceman", name: "Spaceman", imageUrl: "https://cdn.softswiss.net/i/s3/pragmaticexternal/spaceman.png", providerId: null, providerName: "Pragmatic Play", isOriginal: false, supportsFreeRounds: false, gameType: "crash", status: "ACTIVE" },
  { gameCode: "crazy-time", name: "Crazy Time", imageUrl: "https://cdn.softswiss.net/i/s3/evolution/crazytime.png", providerId: null, providerName: "Evolution", isOriginal: false, supportsFreeRounds: false, gameType: "live", status: "ACTIVE" },
  { gameCode: "lightning-roulette", name: "Lightning Roulette", imageUrl: "https://cdn.softswiss.net/i/s3/evolution/lightningroulette.png", providerId: null, providerName: "Evolution", isOriginal: false, supportsFreeRounds: false, gameType: "live", status: "ACTIVE" },
  { gameCode: "blackjack-vip", name: "Blackjack VIP", imageUrl: "https://cdn.softswiss.net/i/s3/evolution/blackjackvip.png", providerId: null, providerName: "Evolution", isOriginal: false, supportsFreeRounds: false, gameType: "live", status: "ACTIVE" },
  { gameCode: "wanted-dead-or-wild", name: "Wanted Dead or Wild", imageUrl: "https://cdn.softswiss.net/i/s3/hacksaw/wanteddeadorawild.png", providerId: null, providerName: "Hacksaw Gaming", isOriginal: false, supportsFreeRounds: true, gameType: "slot", status: "ACTIVE" },
  { gameCode: "mental", name: "Mental", imageUrl: "https://cdn.softswiss.net/i/s3/nolimitcity/mental.png", providerId: null, providerName: "NoLimit City", isOriginal: false, supportsFreeRounds: false, gameType: "slot", status: "ACTIVE" },
  { gameCode: "fire-in-the-hole", name: "Fire in the Hole", imageUrl: "https://cdn.softswiss.net/i/s3/nolimitcity/fireinthehole.png", providerId: null, providerName: "NoLimit City", isOriginal: false, supportsFreeRounds: true, gameType: "slot", status: "ACTIVE" },
  { gameCode: "san-quentin", name: "San Quentin", imageUrl: "https://cdn.softswiss.net/i/s3/nolimitcity/sanquentin.png", providerId: null, providerName: "NoLimit City", isOriginal: false, supportsFreeRounds: true, gameType: "slot", status: "ACTIVE" },
];

export class PlayfiversService {
  async syncProviders(): Promise<PlayfiversProvider[]> {
    if (!client.isConfigured()) {
      console.warn("[PlayFivers] API not configured, using cached data");
      return this.getCachedProviders();
    }

    try {
      const apiProviders = await client.getProviders();
      
      for (const provider of apiProviders) {
        await db
          .insert(playfiversProviders)
          .values({
            externalId: String(provider.id),
            name: provider.name,
            imageUrl: provider.image_url,
            walletName: provider.wallet?.name,
            status: provider.status === 1 ? "ACTIVE" : "INACTIVE",
            lastSyncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: playfiversProviders.externalId,
            set: {
              name: provider.name,
              imageUrl: provider.image_url,
              walletName: provider.wallet?.name,
              status: provider.status === 1 ? "ACTIVE" : "INACTIVE",
              lastSyncedAt: new Date(),
              updatedAt: new Date(),
            },
          });
      }

      return this.getCachedProviders();
    } catch (error) {
      console.error("[PlayFivers] Failed to sync providers:", error);
      return this.getCachedProviders();
    }
  }

  async getCachedProviders(): Promise<PlayfiversProvider[]> {
    const providers = await db.select().from(playfiversProviders).where(eq(playfiversProviders.status, "ACTIVE"));
    
    if (providers.length === 0) {
      return DEMO_PROVIDERS.map((p, i) => ({
        ...p,
        id: `demo-provider-${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
      }));
    }
    
    return providers;
  }

  async syncGames(providerId?: string): Promise<PlayfiversGame[]> {
    if (!client.isConfigured()) {
      console.warn("[PlayFivers] API not configured, using cached data");
      return this.getCachedGames(providerId);
    }

    try {
      const numericProviderId = providerId ? parseInt(providerId) : undefined;
      const apiGames = await client.getGames(numericProviderId);

      const providerMap = new Map<string, string>();
      const providers = await db.select().from(playfiversProviders);
      for (const p of providers) {
        providerMap.set(p.name, p.id);
      }

      for (const game of apiGames) {
        const providerId = providerMap.get(game.provider.name);
        
        await db
          .insert(playfiversGames)
          .values({
            gameCode: game.game_code,
            name: game.name,
            imageUrl: game.image_url,
            providerId: providerId || null,
            providerName: game.provider.name,
            isOriginal: game.original,
            supportsFreeRounds: game.rounds_free,
            status: game.status ? "ACTIVE" : "INACTIVE",
            lastSyncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: playfiversGames.gameCode,
            set: {
              name: game.name,
              imageUrl: game.image_url,
              providerId: providerId || null,
              providerName: game.provider.name,
              isOriginal: game.original,
              supportsFreeRounds: game.rounds_free,
              status: game.status ? "ACTIVE" : "INACTIVE",
              lastSyncedAt: new Date(),
              updatedAt: new Date(),
            },
          });
      }

      return this.getCachedGames(providerId);
    } catch (error) {
      console.error("[PlayFivers] Failed to sync games:", error);
      return this.getCachedGames(providerId);
    }
  }

  async getCachedGames(providerId?: string): Promise<PlayfiversGame[]> {
    let games: PlayfiversGame[];
    
    if (providerId) {
      games = await db
        .select()
        .from(playfiversGames)
        .where(and(
          eq(playfiversGames.providerId, providerId),
          eq(playfiversGames.status, "ACTIVE")
        ));
    } else {
      games = await db.select().from(playfiversGames).where(eq(playfiversGames.status, "ACTIVE"));
    }
    
    if (games.length === 0) {
      const demoGames = DEMO_GAMES.map((g, i) => ({
        ...g,
        id: `demo-game-${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
      })) as PlayfiversGame[];
      
      if (providerId) {
        const demoProviders = await this.getCachedProviders();
        const provider = demoProviders.find(p => p.id === providerId);
        if (provider) {
          return demoGames.filter(g => g.providerName === provider.name);
        }
      }
      
      return demoGames;
    }
    
    return games;
  }

  async getGameByCode(gameCode: string): Promise<PlayfiversGame | null> {
    const [game] = await db
      .select()
      .from(playfiversGames)
      .where(eq(playfiversGames.gameCode, gameCode))
      .limit(1);
    return game || null;
  }

  async launchGame(
    userId: string,
    gameCode: string,
    providerName: string,
    isOriginal: boolean,
    lang: string = "pt"
  ): Promise<{ launchUrl: string; sessionId: string }> {
    if (!client.isConfigured()) {
      throw new PlayfiversApiError("PlayFivers API not configured", 500);
    }

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) {
      throw new PlayfiversApiError("Wallet not found", 404);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new PlayfiversApiError("User not found", 404);
    }

    const userBalance = parseFloat(wallet.balance);
    const userCode = user.email;

    const response = await client.launchGame({
      userCode,
      gameCode,
      provider: providerName,
      gameOriginal: isOriginal,
      userBalance,
      lang,
    });

    if (!response.status || !response.launch_url) {
      throw new PlayfiversApiError(response.msg || "Failed to launch game", 400);
    }

    const game = await this.getGameByCode(gameCode);

    const [session] = await db
      .insert(playfiversSessions)
      .values({
        userId,
        gameId: game?.id || null,
        gameCode,
        providerName,
        launchUrl: response.launch_url,
        balanceAtStart: wallet.balance,
        status: "ACTIVE",
      })
      .returning();

    return {
      launchUrl: response.launch_url,
      sessionId: session.id,
    };
  }

  async grantFreeRounds(
    userId: string,
    gameCode: string,
    rounds: number
  ): Promise<{ success: boolean; message: string }> {
    if (!client.isConfigured()) {
      throw new PlayfiversApiError("PlayFivers API not configured", 500);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new PlayfiversApiError("User not found", 404);
    }

    const response = await client.grantFreeRounds({
      userCode: user.email,
      gameCode,
      rounds,
    });

    return {
      success: response.status,
      message: response.msg,
    };
  }

  async getUserBalance(userCode: string): Promise<number> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, userCode))
      .limit(1);

    if (!user) {
      return 0;
    }

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id))
      .limit(1);

    if (!wallet) {
      return 0;
    }

    return parseFloat(wallet.balance) + parseFloat(wallet.bonusBalance);
  }

  async processTransaction(params: {
    type: string;
    userCode: string;
    agentCode: string;
    agentSecret: string;
    slot: {
      game_code?: string;
      provider?: string;
      bet?: number;
      win?: number;
      transaction_id: string;
    };
  }): Promise<{ balance: number; msg: string }> {
    const { type, userCode, slot } = params;
    const transactionId = slot.transaction_id;

    const existingTx = await db
      .select()
      .from(playfiversTransactions)
      .where(eq(playfiversTransactions.externalTransactionId, transactionId))
      .limit(1);

    if (existingTx.length > 0) {
      console.log(`[PlayFivers] Duplicate transaction ${transactionId}`);
      const balance = await this.getUserBalance(userCode);
      return { balance, msg: "DUPLICATE" };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, userCode))
      .limit(1);

    if (!user) {
      throw new PlayfiversApiError("User not found", 404);
    }

    return db.transaction(async (tx) => {
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, user.id))
        .limit(1);

      if (!wallet) {
        throw new PlayfiversApiError("Wallet not found", 404);
      }

      const txCheck = await tx
        .select()
        .from(playfiversTransactions)
        .where(eq(playfiversTransactions.externalTransactionId, transactionId))
        .limit(1);

      if (txCheck.length > 0) {
        console.log(`[PlayFivers] Duplicate transaction (in tx) ${transactionId}`);
        const balance = parseFloat(wallet.balance) + parseFloat(wallet.bonusBalance);
        return { balance, msg: "DUPLICATE" };
      }

      const balanceBefore = parseFloat(wallet.balance);
      const betAmount = slot.bet || 0;
      const winAmount = slot.win || 0;

      let balanceAfter = balanceBefore;

      if (type === "Bet") {
        if (balanceBefore < betAmount) {
          await tx.insert(playfiversTransactions).values({
            externalTransactionId: transactionId,
            userId: user.id,
            transactionType: PlayfiversTransactionType.BET,
            gameCode: slot.game_code,
            providerName: slot.provider,
            betAmount: String(betAmount),
            winAmount: "0",
            balanceBefore: String(balanceBefore),
            balanceAfter: String(balanceBefore),
            status: PlayfiversTransactionStatus.FAILED,
            errorMessage: "Insufficient balance",
            rawPayload: JSON.stringify(params),
          });

          throw new PlayfiversApiError("Insufficient balance", 400);
        }

        balanceAfter = balanceBefore - betAmount;

        await tx
          .update(wallets)
          .set({
            balance: String(balanceAfter),
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id));

        const [walletTxRecord] = await tx
          .insert(transactions)
          .values({
            userId: user.id,
            walletId: wallet.id,
            type: TransactionType.BET,
            amount: String(-betAmount),
            balanceBefore: String(balanceBefore),
            balanceAfter: String(balanceAfter),
            status: TransactionStatus.COMPLETED,
            referenceId: `playfivers_bet_${transactionId}`,
            description: `Aposta ${slot.provider} - ${slot.game_code}`,
            metadata: JSON.stringify({ playfiversTransactionId: transactionId }),
          })
          .returning();

        await tx.insert(playfiversTransactions).values({
          externalTransactionId: transactionId,
          userId: user.id,
          transactionType: PlayfiversTransactionType.BET,
          gameCode: slot.game_code,
          providerName: slot.provider,
          betAmount: String(betAmount),
          winAmount: "0",
          balanceBefore: String(balanceBefore),
          balanceAfter: String(balanceAfter),
          status: PlayfiversTransactionStatus.SUCCESS,
          walletTransactionId: walletTxRecord.id,
          rawPayload: JSON.stringify(params),
        });
      } else if (type === "WinBet") {
        balanceAfter = balanceBefore + winAmount;

        await tx
          .update(wallets)
          .set({
            balance: String(balanceAfter),
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id));

        const [walletTxRecord] = await tx
          .insert(transactions)
          .values({
            userId: user.id,
            walletId: wallet.id,
            type: TransactionType.WIN,
            amount: String(winAmount),
            balanceBefore: String(balanceBefore),
            balanceAfter: String(balanceAfter),
            status: TransactionStatus.COMPLETED,
            referenceId: `playfivers_win_${transactionId}`,
            description: `Ganho ${slot.provider} - ${slot.game_code}`,
            metadata: JSON.stringify({ playfiversTransactionId: transactionId }),
          })
          .returning();

        await tx.insert(playfiversTransactions).values({
          externalTransactionId: transactionId,
          userId: user.id,
          transactionType: PlayfiversTransactionType.WIN_BET,
          gameCode: slot.game_code,
          providerName: slot.provider,
          betAmount: "0",
          winAmount: String(winAmount),
          balanceBefore: String(balanceBefore),
          balanceAfter: String(balanceAfter),
          status: PlayfiversTransactionStatus.SUCCESS,
          walletTransactionId: walletTxRecord.id,
          rawPayload: JSON.stringify(params),
        });
      }

      return { balance: balanceAfter, msg: "" };
    });
  }

  async getAgentInfo() {
    if (!client.isConfigured()) {
      throw new PlayfiversApiError("PlayFivers API not configured", 500);
    }
    return client.getAgentInfo();
  }

  async getAgentBalances() {
    if (!client.isConfigured()) {
      throw new PlayfiversApiError("PlayFivers API not configured", 500);
    }
    return client.getBalances();
  }

  async closeSession(sessionId: string): Promise<void> {
    await db
      .update(playfiversSessions)
      .set({
        status: "CLOSED",
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(playfiversSessions.id, sessionId));
  }

  async getUserSessions(userId: string): Promise<PlayfiversSession[]> {
    return db
      .select()
      .from(playfiversSessions)
      .where(eq(playfiversSessions.userId, userId))
      .orderBy(desc(playfiversSessions.createdAt))
      .limit(50);
  }

  async getTransactionHistory(userId: string, limit: number = 50): Promise<PlayfiversTransaction[]> {
    return db
      .select()
      .from(playfiversTransactions)
      .where(eq(playfiversTransactions.userId, userId))
      .orderBy(desc(playfiversTransactions.createdAt))
      .limit(limit);
  }
}

export const playfiversService = new PlayfiversService();
