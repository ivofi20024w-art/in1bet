import { createHmac, randomBytes, createHash, randomInt } from "crypto";
import * as BetService from "../betting/bet.service";
import { GameType, DoubleBetType, DoubleBet, DoubleRoundResult, DoubleGameStats, DoubleGameState, DoubleSpinState, DoubleGamePhase } from "@shared/schema";

function generateWheelPattern(): DoubleBetType[] {
  const pattern: DoubleBetType[] = [];
  for (let i = 0; i < 99; i++) {
    if (i === 24 || i === 74) {
      pattern.push("green");
    } else if (i === 49) {
      pattern.push("crown");
    } else {
      const adjustedIndex = i - (i > 24 ? 1 : 0) - (i > 49 ? 1 : 0) - (i > 74 ? 1 : 0);
      pattern.push(adjustedIndex % 2 === 0 ? "black" : "red");
    }
  }
  return pattern;
}

const WHEEL_PATTERN = generateWheelPattern();
const WHEEL_SIZE = WHEEL_PATTERN.length;

export interface DoubleInternalBet {
  odataUserId: string;
  odataUsername: string;
  betId: string;
  betAmount: number;
  color: DoubleBetType;
  winAmount: number | null;
  status: "PENDING" | "WON" | "LOST";
}

interface DoubleGameInternal {
  gameId: string;
  currentRound: number;
  previousRounds: DoubleRoundResult[];
  last100Stats: DoubleGameStats;
  bets: {
    red: DoubleBet[];
    green: DoubleBet[];
    black: DoubleBet[];
    crown: DoubleBet[];
  };
  internalBets: DoubleInternalBet[];
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  gamePhase: DoubleGamePhase;
  phaseStartTime: number;
  phaseEndTime: number;
  isSpinning: boolean;
  pendingResult: DoubleBetType | null;
  stopIndex: number | null;
  spinStartTime: number | null;
  spinId: string | null;
  lastResult: DoubleBetType | null;
  lastStopIndex: number | null;
  previousServerSeed: string | null;
  previousClientSeed: string | null;
  previousNonce: number | null;
}

let currentGame: DoubleGameInternal | null = null;
let gameLoopInterval: NodeJS.Timeout | null = null;
let gameNonce = 0;

const SPIN_DURATION = 5000;
const SHOWING_RESULT_DURATION = 4000;
const BETTING_DURATION = 15000;
const BET_LOCK_TIME = 1000;

const MULTIPLIERS: Record<DoubleBetType, number> = {
  red: 2,
  green: 7,
  black: 2,
  crown: 14,
};

function secureRandomInt(min: number, max: number): number {
  return randomInt(min, max);
}

function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

function hashServerSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

function calculateStopIndex(serverSeed: string, clientSeed: string, nonce: number): number {
  const message = `${clientSeed}:${nonce}`;
  const hmac = createHmac("sha256", serverSeed).update(message).digest("hex");
  const hash = parseInt(hmac.slice(0, 8), 16);
  return hash % WHEEL_SIZE;
}

function getColorFromIndex(index: number): DoubleBetType {
  return WHEEL_PATTERN[index];
}

function generatePreviousRounds(count: number): DoubleRoundResult[] {
  const rounds: DoubleRoundResult[] = [];
  for (let i = 0; i < count; i++) {
    const idx = secureRandomInt(0, WHEEL_SIZE);
    rounds.push({
      id: i + 1,
      type: getColorFromIndex(idx),
    });
  }
  return rounds;
}

function calculateLast100Stats(rounds: DoubleRoundResult[]): DoubleGameStats {
  const stats: DoubleGameStats = { red: 0, green: 0, black: 0, crown: 0 };
  const last100 = rounds.slice(-100);
  for (const round of last100) {
    stats[round.type]++;
  }
  return stats;
}

function createNewGame(startPhase: DoubleGamePhase = "BETTING"): DoubleGameInternal {
  const serverSeed = generateServerSeed();
  const clientSeed = randomBytes(16).toString("hex");
  gameNonce++;
  
  const previousRounds = currentGame?.previousRounds || generatePreviousRounds(100);
  const currentRound = currentGame ? currentGame.currentRound : 101;
  const now = Date.now();
  
  let phaseDuration = BETTING_DURATION;
  if (startPhase === "SHOWING_RESULT") {
    phaseDuration = SHOWING_RESULT_DURATION;
  }
  
  return {
    gameId: randomBytes(8).toString("hex"),
    currentRound,
    previousRounds,
    last100Stats: calculateLast100Stats(previousRounds),
    bets: {
      red: [],
      green: [],
      black: [],
      crown: [],
    },
    internalBets: [],
    serverSeed,
    serverSeedHash: hashServerSeed(serverSeed),
    clientSeed,
    nonce: gameNonce,
    gamePhase: startPhase,
    phaseStartTime: now,
    phaseEndTime: now + phaseDuration,
    isSpinning: false,
    pendingResult: null,
    stopIndex: null,
    spinStartTime: null,
    spinId: null,
    lastResult: currentGame?.lastResult || null,
    lastStopIndex: currentGame?.lastStopIndex || null,
    previousServerSeed: currentGame?.serverSeed || null,
    previousClientSeed: currentGame?.clientSeed || null,
    previousNonce: currentGame?.nonce || null,
  };
}

function startSpin(): void {
  if (!currentGame || currentGame.isSpinning) return;
  
  const spinId = randomBytes(8).toString("hex");
  const stopIndex = calculateStopIndex(currentGame.serverSeed, currentGame.clientSeed, currentGame.nonce);
  const pendingResult = getColorFromIndex(stopIndex);
  const now = Date.now();
  
  const totalSpinTime = SPIN_DURATION + 1000;
  
  currentGame.gamePhase = "SPINNING";
  currentGame.isSpinning = true;
  currentGame.pendingResult = pendingResult;
  currentGame.stopIndex = stopIndex;
  currentGame.spinStartTime = now;
  currentGame.spinId = spinId;
  currentGame.phaseStartTime = now;
  currentGame.phaseEndTime = now + totalSpinTime;
  
  console.log(`[DOUBLE] Game ${currentGame.gameId} spinning, stopIndex: ${stopIndex}, result: ${pendingResult}`);
  
  setTimeout(() => {
    finishRound(spinId);
  }, totalSpinTime);
}

async function finishRound(expectedSpinId: string): Promise<void> {
  if (!currentGame || currentGame.spinId !== expectedSpinId) return;
  if (!currentGame.pendingResult) return;
  
  const winningType = currentGame.pendingResult;
  const stopIndex = currentGame.stopIndex;
  const multiplier = MULTIPLIERS[winningType];
  
  for (const bet of currentGame.internalBets) {
    if (bet.status !== "PENDING") continue;
    
    const won = bet.color === winningType;
    const winAmount = won ? bet.betAmount * multiplier : 0;
    
    bet.status = won ? "WON" : "LOST";
    bet.winAmount = winAmount;
    
    try {
      await BetService.settleBet({
        betId: bet.betId,
        userId: bet.odataUserId,
        won,
        multiplier: won ? multiplier : 0,
        gameResult: {
          result: winningType,
          stopIndex,
          betColor: bet.color,
        },
      });
    } catch (err) {
      console.error(`[DOUBLE] Failed to settle bet ${bet.betId}:`, err);
    }
  }
  
  const newRound: DoubleRoundResult = {
    id: currentGame.currentRound,
    type: winningType,
  };
  
  currentGame.previousRounds.push(newRound);
  if (currentGame.previousRounds.length > 100) {
    currentGame.previousRounds.shift();
  }
  
  currentGame.last100Stats = calculateLast100Stats(currentGame.previousRounds);
  currentGame.currentRound++;
  
  const now = Date.now();
  currentGame.isSpinning = false;
  currentGame.lastResult = winningType;
  currentGame.lastStopIndex = stopIndex;
  currentGame.gamePhase = "SHOWING_RESULT";
  currentGame.phaseStartTime = now;
  currentGame.phaseEndTime = now + SHOWING_RESULT_DURATION;
  currentGame.pendingResult = null;
  currentGame.stopIndex = null;
  currentGame.spinStartTime = null;
  currentGame.spinId = null;
  
  console.log(`[DOUBLE] Game finished at ${winningType}, showing result for ${SHOWING_RESULT_DURATION}ms`);
}

function processGamePhase(): void {
  if (!currentGame) {
    currentGame = createNewGame("BETTING");
    console.log(`[DOUBLE] New game ${currentGame.gameId} created in BETTING phase`);
    return;
  }
  
  const now = Date.now();
  
  if (now >= currentGame.phaseEndTime) {
    switch (currentGame.gamePhase) {
      case "SHOWING_RESULT":
        const oldServerSeed = currentGame.serverSeed;
        const oldClientSeed = currentGame.clientSeed;
        const oldNonce = currentGame.nonce;
        const lastResult = currentGame.lastResult;
        const lastStopIndex = currentGame.lastStopIndex;
        const previousRounds = currentGame.previousRounds;
        const currentRound = currentGame.currentRound;
        const last100Stats = currentGame.last100Stats;
        
        currentGame = createNewGame("BETTING");
        currentGame.previousRounds = previousRounds;
        currentGame.currentRound = currentRound;
        currentGame.last100Stats = last100Stats;
        currentGame.lastResult = lastResult;
        currentGame.lastStopIndex = lastStopIndex;
        currentGame.previousServerSeed = oldServerSeed;
        currentGame.previousClientSeed = oldClientSeed;
        currentGame.previousNonce = oldNonce;
        
        console.log(`[DOUBLE] SHOWING_RESULT ended, starting BETTING phase for ${BETTING_DURATION}ms`);
        break;
        
      case "BETTING":
        startSpin();
        console.log(`[DOUBLE] BETTING ended, starting SPINNING phase`);
        break;
        
      case "SPINNING":
        break;
    }
  }
}

export function startGameLoop(): void {
  if (gameLoopInterval) return;
  
  currentGame = createNewGame("BETTING");
  console.log(`[DOUBLE] Game loop started with BETTING phase`);
  
  gameLoopInterval = setInterval(() => {
    processGamePhase();
  }, 100);
}

export function getGameState(userId?: string): DoubleGameState & DoubleSpinState {
  if (!currentGame) {
    currentGame = createNewGame("BETTING");
  }
  
  const now = Date.now();
  const timeRemaining = Math.max(0, currentGame.phaseEndTime - now);
  const bettingTimeRemaining = currentGame.gamePhase === "BETTING" ? Math.ceil(timeRemaining / 1000) : 0;
  const canBet = currentGame.gamePhase === "BETTING" && timeRemaining > BET_LOCK_TIME;
  
  return {
    balance: 0,
    currentRound: currentGame.currentRound,
    previousRounds: currentGame.previousRounds,
    last100Stats: currentGame.last100Stats,
    bets: currentGame.bets,
    isSpinning: currentGame.isSpinning,
    pendingResult: currentGame.pendingResult,
    stopIndex: currentGame.stopIndex,
    spinStartTime: currentGame.spinStartTime,
    spinId: currentGame.spinId,
    spinDuration: SPIN_DURATION,
    lastResult: currentGame.lastResult,
    lastStopIndex: currentGame.lastStopIndex,
    gamePhase: currentGame.gamePhase,
    phaseEndTime: currentGame.phaseEndTime,
    bettingTimeRemaining,
    canBet,
    serverSeedHash: currentGame.serverSeedHash,
    previousServerSeed: currentGame.previousServerSeed,
    previousClientSeed: currentGame.previousClientSeed,
    previousNonce: currentGame.previousNonce,
  };
}

export function getHistory(): DoubleRoundResult[] {
  if (!currentGame) return [];
  return currentGame.previousRounds.slice(-50).reverse();
}

export async function placeBet(
  userId: string,
  username: string,
  betAmount: number,
  color: DoubleBetType,
  clientSeed?: string
): Promise<{ success: boolean; bet?: DoubleInternalBet; error?: string }> {
  if (!currentGame) {
    return { success: false, error: "Jogo não disponível" };
  }
  
  const now = Date.now();
  const timeRemaining = currentGame.phaseEndTime - now;
  
  if (currentGame.gamePhase !== "BETTING") {
    return { success: false, error: "Apostas fechadas" };
  }
  
  if (timeRemaining <= BET_LOCK_TIME) {
    return { success: false, error: "Apostas bloqueadas - aguarde a próxima rodada" };
  }
  
  if (betAmount < 0.01) {
    return { success: false, error: "Aposta mínima: R$ 0,01" };
  }
  
  if (betAmount > 10000) {
    return { success: false, error: "Aposta máxima: R$ 10.000,00" };
  }
  
  if (!["red", "green", "black", "crown"].includes(color)) {
    return { success: false, error: "Cor inválida" };
  }
  
  const existingBet = currentGame.internalBets.find(
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
  
  const maskedUsername = username.length > 4 
    ? username.slice(0, 3) + "***" + username.slice(-2)
    : username;
  
  const internalBet: DoubleInternalBet = {
    odataUserId: userId,
    odataUsername: maskedUsername,
    betId: betResult.bet.id,
    betAmount,
    color,
    winAmount: null,
    status: "PENDING",
  };
  
  currentGame.internalBets.push(internalBet);
  
  const displayBet: DoubleBet = {
    id: internalBet.betId,
    username: maskedUsername,
    amount: betAmount,
    type: color,
  };
  
  currentGame.bets[color] = [displayBet, ...currentGame.bets[color]];
  
  console.log(`[DOUBLE] Player ${maskedUsername} bet R$${betAmount} on ${color}`);
  
  return { success: true, bet: internalBet };
}

export function stopGameLoop(): void {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
  }
}
