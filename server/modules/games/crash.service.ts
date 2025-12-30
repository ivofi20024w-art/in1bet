import { createHash, createHmac, randomBytes } from "crypto";
import { db } from "../../db";
import { bets, BetStatus, GameType } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import * as BetService from "../betting/bet.service";

export interface CrashGameState {
  gameId: string;
  status: "WAITING" | "RUNNING" | "CRASHED";
  startTime: number | null;
  crashPoint: number | null;
  currentMultiplier: number;
  players: CrashPlayer[];
  serverSeedHash: string;
  nextGameIn: number;
}

export interface CrashPlayer {
  odataUserId: string;
  odataUsername: string;
  betId: string;
  betAmount: number;
  cashoutMultiplier: number | null;
  winAmount: number | null;
  status: "ACTIVE" | "WON" | "LOST";
}

export interface PlaceCrashBetRequest {
  userId: string;
  username: string;
  betAmount: number;
  autoCashout?: number;
  clientSeed?: string;
}

export interface CashoutCrashRequest {
  userId: string;
  betId: string;
}

const GAME_INTERVAL_MS = 15000;
const BETTING_PHASE_MS = 10000;
const MIN_CRASH = 1.0;
const HOUSE_EDGE = 0.03;

let currentGame: CrashGameState | null = null;
let gameLoopInterval: NodeJS.Timeout | null = null;
let serverSeed: string = "";
let clientSeed: string = "public_seed";
let nonce: number = 0;

function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

function hashServerSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

function generateCrashPoint(serverSeed: string, clientSeed: string, nonce: number): number {
  const message = `${clientSeed}:${nonce}`;
  const hmac = createHmac("sha256", serverSeed).update(message).digest("hex");
  
  const h = parseInt(hmac.slice(0, 13), 16);
  const e = Math.pow(2, 52);
  
  if (h % 33 === 0) {
    return 1.0;
  }
  
  const rawCrash = (100 * e - h) / (e - h);
  const crash = Math.floor(rawCrash) / 100;
  
  const adjustedCrash = crash * (1 - HOUSE_EDGE);
  
  return Math.max(MIN_CRASH, Math.round(adjustedCrash * 100) / 100);
}

function startNewGame(): void {
  serverSeed = generateServerSeed();
  nonce++;
  
  const crashPoint = generateCrashPoint(serverSeed, clientSeed, nonce);
  
  currentGame = {
    gameId: randomBytes(8).toString("hex"),
    status: "WAITING",
    startTime: null,
    crashPoint,
    currentMultiplier: 1.0,
    players: [],
    serverSeedHash: hashServerSeed(serverSeed),
    nextGameIn: BETTING_PHASE_MS,
  };
  
  console.log(`[CRASH] New game ${currentGame.gameId} created, crash point: ${crashPoint}x`);
  
  setTimeout(() => {
    if (currentGame && currentGame.status === "WAITING") {
      currentGame.status = "RUNNING";
      currentGame.startTime = Date.now();
      currentGame.nextGameIn = 0;
      console.log(`[CRASH] Game ${currentGame.gameId} started`);
    }
  }, BETTING_PHASE_MS);
}

function updateGameMultiplier(): void {
  if (!currentGame || currentGame.status !== "RUNNING" || !currentGame.startTime) {
    return;
  }
  
  const elapsed = Date.now() - currentGame.startTime;
  const growthRate = 0.00006;
  currentGame.currentMultiplier = Math.round(Math.pow(Math.E, growthRate * elapsed) * 100) / 100;
  
  if (currentGame.currentMultiplier >= currentGame.crashPoint!) {
    crashGame();
  }
}

async function crashGame(): Promise<void> {
  if (!currentGame) return;
  
  currentGame.status = "CRASHED";
  currentGame.currentMultiplier = currentGame.crashPoint!;
  
  console.log(`[CRASH] Game ${currentGame.gameId} crashed at ${currentGame.crashPoint}x`);
  
  for (const player of currentGame.players) {
    if (player.status === "ACTIVE") {
      player.status = "LOST";
      player.winAmount = 0;
      
      await BetService.settleBet({
        betId: player.betId,
        userId: player.odataUserId,
        won: false,
        multiplier: 0,
        gameResult: {
          crashPoint: currentGame.crashPoint,
          cashedOut: false,
        },
      });
    }
  }
  
  setTimeout(() => {
    startNewGame();
  }, GAME_INTERVAL_MS - BETTING_PHASE_MS);
}

export function startGameLoop(): void {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
  }
  
  startNewGame();
  
  gameLoopInterval = setInterval(() => {
    updateGameMultiplier();
  }, 50);
  
  console.log("[CRASH] Game loop started");
}

export function stopGameLoop(): void {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
  }
  console.log("[CRASH] Game loop stopped");
}

export function getCurrentGame(): CrashGameState | null {
  if (!currentGame) return null;
  
  const safeGame: CrashGameState = {
    ...currentGame,
    crashPoint: currentGame.status === "CRASHED" ? currentGame.crashPoint : null,
    players: currentGame.players.map(p => ({
      ...p,
      odataUserId: p.odataUserId.slice(0, 8) + "...",
    })),
  };
  
  if (currentGame.status === "WAITING") {
    safeGame.nextGameIn = Math.max(0, BETTING_PHASE_MS - (Date.now() - (currentGame.startTime || Date.now())));
  }
  
  return safeGame;
}

export async function placeBet(request: PlaceCrashBetRequest): Promise<{
  success: boolean;
  bet?: CrashPlayer;
  error?: string;
}> {
  const { userId, username, betAmount, autoCashout, clientSeed: userClientSeed } = request;
  
  if (!currentGame || currentGame.status !== "WAITING") {
    return { success: false, error: "Apostas fechadas. Aguarde a próxima rodada." };
  }
  
  const existingBet = currentGame.players.find(p => p.odataUserId === userId);
  if (existingBet) {
    return { success: false, error: "Você já apostou nesta rodada" };
  }
  
  const betResult = await BetService.placeBet({
    userId,
    gameType: GameType.CRASH,
    betAmount,
    gamePayload: { 
      gameId: currentGame.gameId,
      autoCashout,
    },
    clientSeed: userClientSeed,
  });
  
  if (!betResult.success || !betResult.bet) {
    return { success: false, error: betResult.error };
  }
  
  const player: CrashPlayer = {
    odataUserId: userId,
    odataUsername: username,
    betId: betResult.bet.id,
    betAmount,
    cashoutMultiplier: null,
    winAmount: null,
    status: "ACTIVE",
  };
  
  currentGame.players.push(player);
  
  console.log(`[CRASH] Player ${username} bet R$${betAmount} in game ${currentGame.gameId}`);
  
  return { success: true, bet: player };
}

export async function cashout(request: CashoutCrashRequest): Promise<{
  success: boolean;
  multiplier?: number;
  winAmount?: number;
  error?: string;
}> {
  const { userId, betId } = request;
  
  if (!currentGame || currentGame.status !== "RUNNING") {
    return { success: false, error: "Não é possível fazer cashout agora" };
  }
  
  const playerIndex = currentGame.players.findIndex(
    p => p.odataUserId === userId && p.betId === betId && p.status === "ACTIVE"
  );
  
  if (playerIndex === -1) {
    return { success: false, error: "Aposta não encontrada ou já encerrada" };
  }
  
  const player = currentGame.players[playerIndex];
  const multiplier = currentGame.currentMultiplier;
  const winAmount = Math.round(player.betAmount * multiplier * 100) / 100;
  
  player.status = "WON";
  player.cashoutMultiplier = multiplier;
  player.winAmount = winAmount;
  
  await BetService.settleBet({
    betId: player.betId,
    userId,
    won: true,
    multiplier,
    gameResult: {
      crashPoint: currentGame.crashPoint,
      cashoutMultiplier: multiplier,
      cashedOut: true,
    },
  });
  
  console.log(`[CRASH] Player cashed out at ${multiplier}x, won R$${winAmount}`);
  
  return { success: true, multiplier, winAmount };
}

export async function getRecentGames(limit: number = 20): Promise<{
  gameId: string;
  crashPoint: number;
  createdAt: Date;
}[]> {
  const recentBets = await db
    .select()
    .from(bets)
    .where(eq(bets.gameType, GameType.CRASH))
    .orderBy(desc(bets.createdAt))
    .limit(limit * 5);
  
  const gameMap = new Map<string, { crashPoint: number; createdAt: Date }>();
  
  for (const bet of recentBets) {
    if (bet.gameResult && bet.status !== BetStatus.ACTIVE) {
      try {
        const result = JSON.parse(bet.gameResult);
        const gamePayload = bet.gamePayload ? JSON.parse(bet.gamePayload) : {};
        const gameId = gamePayload.gameId;
        
        if (gameId && result.crashPoint && !gameMap.has(gameId)) {
          gameMap.set(gameId, {
            crashPoint: result.crashPoint,
            createdAt: bet.createdAt,
          });
        }
      } catch (e) {}
    }
  }
  
  return Array.from(gameMap.entries())
    .map(([gameId, data]) => ({
      gameId,
      ...data,
    }))
    .slice(0, limit);
}

export async function getActiveUserBet(userId: string): Promise<CrashPlayer | null> {
  if (!currentGame) return null;
  
  const player = currentGame.players.find(p => p.odataUserId === userId);
  return player || null;
}
