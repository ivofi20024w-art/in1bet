import { createHmac, randomBytes, createHash } from "crypto";
import * as BetService from "../betting/bet.service";
import { GameType } from "@shared/schema";

export type DoubleColor = "RED" | "BLACK" | "WHITE";
export type DoubleStatus = "WAITING" | "SPINNING" | "FINISHED";

export interface DoubleBet {
  odataUserId: string;
  odataUsername: string;
  betId: string;
  betAmount: number;
  color: DoubleColor;
  winAmount: number | null;
  status: "PENDING" | "WON" | "LOST";
}

export interface DoubleGame {
  gameId: string;
  status: DoubleStatus;
  result: number | null;
  resultColor: DoubleColor | null;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  bets: DoubleBet[];
  startTime: number | null;
  spinTime: number | null;
  nextGameIn: number;
}

let currentGame: DoubleGame | null = null;
let gameHistory: { gameId: string; result: number; resultColor: DoubleColor; createdAt: string }[] = [];
let gameLoopInterval: NodeJS.Timeout | null = null;
let gameNonce = 0;

const BETTING_DURATION = 15000;
const SPIN_DURATION = 8000;
const RESULT_DISPLAY_DURATION = 5000;
const HOUSE_EDGE = 0.03;

const COLORS: Record<number, DoubleColor> = {
  0: "WHITE",
  1: "RED", 2: "BLACK", 3: "RED", 4: "BLACK",
  5: "RED", 6: "BLACK", 7: "RED", 8: "BLACK",
  9: "RED", 10: "BLACK", 11: "RED", 12: "BLACK",
  13: "RED", 14: "BLACK"
};

const MULTIPLIERS: Record<DoubleColor, number> = {
  RED: 2,
  BLACK: 2,
  WHITE: 14
};

function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

function hashServerSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

function calculateResult(serverSeed: string, clientSeed: string, nonce: number): number {
  const message = `${clientSeed}:${nonce}`;
  const hmac = createHmac("sha256", serverSeed).update(message).digest("hex");
  const hash = parseInt(hmac.slice(0, 8), 16);
  return hash % 15;
}

function getColorFromResult(result: number): DoubleColor {
  return COLORS[result];
}

function createNewGame(): DoubleGame {
  const serverSeed = generateServerSeed();
  const clientSeed = randomBytes(16).toString("hex");
  gameNonce++;
  
  return {
    gameId: randomBytes(8).toString("hex"),
    status: "WAITING",
    result: null,
    resultColor: null,
    serverSeed,
    serverSeedHash: hashServerSeed(serverSeed),
    clientSeed,
    nonce: gameNonce,
    bets: [],
    startTime: Date.now(),
    spinTime: null,
    nextGameIn: BETTING_DURATION,
  };
}

export function startGameLoop(): void {
  if (gameLoopInterval) return;
  
  currentGame = createNewGame();
  console.log(`[DOUBLE] Game loop started`);
  
  gameLoopInterval = setInterval(() => {
    if (!currentGame) {
      currentGame = createNewGame();
      return;
    }
    
    const now = Date.now();
    const elapsed = now - (currentGame.startTime || now);
    
    if (currentGame.status === "WAITING") {
      currentGame.nextGameIn = Math.max(0, BETTING_DURATION - elapsed);
      
      if (elapsed >= BETTING_DURATION) {
        currentGame.status = "SPINNING";
        currentGame.spinTime = now;
        currentGame.result = calculateResult(currentGame.serverSeed, currentGame.clientSeed, currentGame.nonce);
        currentGame.resultColor = getColorFromResult(currentGame.result);
        console.log(`[DOUBLE] Game ${currentGame.gameId} spinning, result: ${currentGame.result} (${currentGame.resultColor})`);
      }
    } else if (currentGame.status === "SPINNING") {
      const spinElapsed = now - (currentGame.spinTime || now);
      
      if (spinElapsed >= SPIN_DURATION) {
        currentGame.status = "FINISHED";
        settleBets(currentGame);
        
        gameHistory.unshift({
          gameId: currentGame.gameId,
          result: currentGame.result!,
          resultColor: currentGame.resultColor!,
          createdAt: new Date().toISOString(),
        });
        
        if (gameHistory.length > 50) {
          gameHistory = gameHistory.slice(0, 50);
        }
        
        console.log(`[DOUBLE] Game ${currentGame.gameId} finished at ${currentGame.resultColor}`);
      }
    } else if (currentGame.status === "FINISHED") {
      const spinElapsed = now - (currentGame.spinTime || now);
      currentGame.nextGameIn = Math.max(0, SPIN_DURATION + RESULT_DISPLAY_DURATION - spinElapsed);
      
      if (spinElapsed >= SPIN_DURATION + RESULT_DISPLAY_DURATION) {
        currentGame = createNewGame();
        console.log(`[DOUBLE] New game ${currentGame.gameId} created`);
      }
    }
  }, 100);
}

async function settleBets(game: DoubleGame): Promise<void> {
  for (const bet of game.bets) {
    if (bet.status !== "PENDING") continue;
    
    const won = bet.color === game.resultColor;
    const multiplier = won ? MULTIPLIERS[bet.color] : 0;
    const winAmount = won ? bet.betAmount * multiplier : 0;
    
    bet.status = won ? "WON" : "LOST";
    bet.winAmount = winAmount;
    
    try {
      await BetService.settleBet({
        betId: bet.betId,
        userId: bet.odataUserId,
        won,
        multiplier,
        gameResult: {
          result: game.result,
          resultColor: game.resultColor,
          betColor: bet.color,
        },
      });
    } catch (err) {
      console.error(`[DOUBLE] Failed to settle bet ${bet.betId}:`, err);
    }
  }
}

export function getGameState(userId?: string): { game: DoubleGame | null; activeBets: DoubleBet[] } {
  if (!currentGame) {
    return { game: null, activeBets: [] };
  }
  
  const sanitizedGame: DoubleGame = {
    ...currentGame,
    serverSeed: "",
    result: currentGame.status === "FINISHED" ? currentGame.result : null,
    resultColor: currentGame.status !== "WAITING" ? currentGame.resultColor : null,
  };
  
  const activeBets = userId 
    ? currentGame.bets.filter(b => b.odataUserId === userId)
    : [];
  
  return { game: sanitizedGame, activeBets };
}

export function getHistory(): typeof gameHistory {
  return gameHistory;
}

export async function placeBet(
  userId: string,
  username: string,
  betAmount: number,
  color: DoubleColor,
  clientSeed?: string
): Promise<{ success: boolean; bet?: DoubleBet; error?: string }> {
  if (!currentGame || currentGame.status !== "WAITING") {
    return { success: false, error: "Apostas fechadas" };
  }
  
  if (betAmount < 1) {
    return { success: false, error: "Aposta mínima: R$ 1,00" };
  }
  
  if (!["RED", "BLACK", "WHITE"].includes(color)) {
    return { success: false, error: "Cor inválida" };
  }
  
  const existingBet = currentGame.bets.find(
    b => b.odataUserId === userId && b.color === color && b.status === "PENDING"
  );
  if (existingBet) {
    return { success: false, error: "Você já apostou nesta cor" };
  }
  
  const betResult = await BetService.placeBet({
    userId,
    gameType: GameType.DOUBLE,
    betAmount,
    gamePayload: { color },
    clientSeed,
  });
  
  if (!betResult.success || !betResult.bet) {
    return { success: false, error: betResult.error || "Erro ao apostar" };
  }
  
  const bet: DoubleBet = {
    odataUserId: userId,
    odataUsername: username.slice(0, 4) + "***" + username.slice(-2),
    betId: betResult.bet.id,
    betAmount,
    color,
    winAmount: null,
    status: "PENDING",
  };
  
  currentGame.bets.push(bet);
  console.log(`[DOUBLE] Player ${bet.odataUsername} bet R$${betAmount} on ${color}`);
  
  return { success: true, bet };
}

export function stopGameLoop(): void {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
  }
}
