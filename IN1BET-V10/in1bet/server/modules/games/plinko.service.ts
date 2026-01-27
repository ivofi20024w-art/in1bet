import { createHmac, randomBytes, createHash } from "crypto";
import * as BetService from "../betting/bet.service";
import { GameType } from "@shared/schema";
import { addXpFromWager } from "../levels/level.service";

export type PlinkoRisk = "LOW" | "MEDIUM" | "HIGH";
export type PlinkoRows = 8 | 12 | 16;

export interface PlinkoBet {
  betId: string;
  userId: string;
  username: string;
  betAmount: number;
  risk: PlinkoRisk;
  rows: PlinkoRows;
  path: number[];
  bucket: number;
  multiplier: number;
  winAmount: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  createdAt: string;
}

const MULTIPLIERS: Record<PlinkoRisk, Record<PlinkoRows, number[]>> = {
  LOW: {
    8: [5.6, 2.1, 1.1, 0.5, 0.3, 0.5, 1.1, 2.1, 5.6],
    12: [8.9, 3, 1.4, 1.1, 0.5, 0.3, 0.2, 0.3, 0.5, 1.1, 1.4, 3, 8.9],
    16: [16, 9, 2, 1.4, 1.2, 0.7, 0.4, 0.3, 0.2, 0.3, 0.4, 0.7, 1.2, 1.4, 2, 9, 16],
  },
  MEDIUM: {
    8: [13, 3, 1.3, 0.4, 0.2, 0.4, 1.3, 3, 13],
    12: [33, 11, 4, 2, 0.6, 0.3, 0.2, 0.3, 0.6, 2, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1, 0.4, 0.2, 0.1, 0.2, 0.4, 1, 3, 5, 10, 41, 110],
  },
  HIGH: {
    8: [29, 4, 1.5, 0.2, 0.1, 0.2, 1.5, 4, 29],
    12: [170, 24, 8.1, 2, 0.4, 0.1, 0.1, 0.1, 0.4, 2, 8.1, 24, 170],
    16: [1000, 130, 26, 9, 4, 1, 0.1, 0.1, 0.1, 0.1, 0.1, 1, 4, 9, 26, 130, 1000],
  },
};

let recentBets: PlinkoBet[] = [];
let globalNonce = 0;

function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

function hashServerSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

function calculatePath(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  rows: PlinkoRows
): { path: number[]; bucket: number } {
  const path: number[] = [];
  let position = 0;
  
  for (let i = 0; i < rows; i++) {
    const message = `${clientSeed}:${nonce}:${i}`;
    const hmac = createHmac("sha256", serverSeed).update(message).digest("hex");
    const hash = parseInt(hmac.slice(0, 8), 16);
    const direction = hash % 2;
    path.push(direction);
    position += direction;
  }
  
  return { path, bucket: position };
}

export async function playPlinko(
  userId: string,
  username: string,
  betAmount: number,
  risk: PlinkoRisk,
  rows: PlinkoRows,
  clientSeed?: string
): Promise<{ success: boolean; bet?: PlinkoBet; error?: string }> {
  if (betAmount < 1) {
    return { success: false, error: "Aposta mínima: R$ 1,00" };
  }
  
  if (!["LOW", "MEDIUM", "HIGH"].includes(risk)) {
    return { success: false, error: "Risco inválido" };
  }
  
  if (![8, 12, 16].includes(rows)) {
    return { success: false, error: "Número de linhas inválido" };
  }
  
  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  const finalClientSeed = clientSeed || randomBytes(16).toString("hex");
  globalNonce++;
  const nonce = globalNonce;
  
  const betResult = await BetService.placeBet({
    userId,
    gameType: GameType.PLINKO,
    betAmount,
    gamePayload: { risk, rows },
    clientSeed: finalClientSeed,
  });
  
  if (!betResult.success || !betResult.bet) {
    return { success: false, error: betResult.error || "Erro ao apostar" };
  }
  
  try {
    await addXpFromWager(userId, betAmount);
  } catch (err) {
    console.error(`[PLINKO] Failed to add XP for user ${userId}:`, err);
  }
  
  const { path, bucket } = calculatePath(serverSeed, finalClientSeed, nonce, rows);
  const multipliers = MULTIPLIERS[risk][rows];
  const multiplier = multipliers[bucket];
  const winAmount = betAmount * multiplier;
  const won = multiplier >= 1;
  
  try {
    await BetService.settleBet({
      betId: betResult.bet.id,
      userId,
      won,
      multiplier,
      gameResult: {
        path,
        bucket,
        multiplier,
        risk,
        rows,
        serverSeed,
        serverSeedHash,
        clientSeed: finalClientSeed,
        nonce,
      },
    });
  } catch (err) {
    console.error(`[PLINKO] Failed to settle bet ${betResult.bet.id}:`, err);
    return { success: false, error: "Erro ao processar resultado" };
  }
  
  const bet: PlinkoBet = {
    betId: betResult.bet.id,
    userId,
    username: username.slice(0, 4) + "***" + username.slice(-2),
    betAmount,
    risk,
    rows,
    path,
    bucket,
    multiplier,
    winAmount,
    serverSeed,
    serverSeedHash,
    clientSeed: finalClientSeed,
    nonce,
    createdAt: new Date().toISOString(),
  };
  
  recentBets.unshift(bet);
  if (recentBets.length > 50) {
    recentBets = recentBets.slice(0, 50);
  }
  
  console.log(`[PLINKO] Player ${bet.username} bet R$${betAmount} on ${risk}/${rows}, bucket ${bucket} = ${multiplier}x`);
  
  return { success: true, bet };
}

export function getRecentBets(limit: number = 20): PlinkoBet[] {
  return recentBets.slice(0, limit).map(bet => ({
    ...bet,
    serverSeed: "",
  }));
}

export function getMultipliers(risk: PlinkoRisk, rows: PlinkoRows): number[] {
  return MULTIPLIERS[risk][rows];
}
