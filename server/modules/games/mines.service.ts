import { createHash, createHmac, randomBytes } from "crypto";
import { db } from "../../db";
import { bets, minesGames, BetStatus, GameType } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import * as BetService from "../betting/bet.service";

export interface MinesGameState {
  betId: string;
  grid: number[];
  minePositions: number[];
  mineCount: number;
  revealed: number[];
  multiplier: number;
  nextMultiplier: number;
  status: "ACTIVE" | "WON" | "LOST";
  serverSeedHash: string;
}

export interface StartMinesRequest {
  userId: string;
  betAmount: number;
  mineCount: number;
  clientSeed?: string;
}

export interface RevealTileRequest {
  userId: string;
  betId: string;
  tileIndex: number;
}

export interface CashoutRequest {
  userId: string;
  betId: string;
}

const GRID_SIZE = 25;
const MIN_MINES = 1;
const MAX_MINES = 24;

function generateMinePositions(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  mineCount: number
): number[] {
  const grid = Array.from({ length: GRID_SIZE }, (_, i) => i);
  
  for (let i = GRID_SIZE - 1; i > 0; i--) {
    const message = `${clientSeed}:${nonce}:${i}`;
    const hmac = createHmac("sha256", serverSeed).update(message).digest("hex");
    const j = parseInt(hmac.slice(0, 8), 16) % (i + 1);
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }
  
  return grid.slice(0, mineCount);
}

function calculateMultiplier(
  revealed: number,
  mineCount: number,
  houseEdge: number = 0.01
): number {
  if (revealed === 0) return 1;
  
  const totalTiles = GRID_SIZE;
  const safeTiles = totalTiles - mineCount;
  
  let probability = 1;
  for (let i = 0; i < revealed; i++) {
    probability *= (safeTiles - i) / (totalTiles - i);
  }
  
  const fairMultiplier = 1 / probability;
  const multiplier = fairMultiplier * (1 - houseEdge);
  
  return Math.round(multiplier * 100) / 100;
}

async function getGameFromDb(betId: string, userId: string): Promise<MinesGameState | null> {
  const [game] = await db
    .select()
    .from(minesGames)
    .where(and(eq(minesGames.betId, betId), eq(minesGames.userId, userId)));
  
  if (!game) return null;

  const [bet] = await db
    .select()
    .from(bets)
    .where(eq(bets.id, betId));
  
  if (!bet) return null;

  const minePositions = JSON.parse(game.minePositions);
  const revealed = JSON.parse(game.revealed);
  const mineCount = parseInt(game.mineCount);

  return {
    betId: game.betId,
    grid: Array(GRID_SIZE).fill(0),
    minePositions,
    mineCount,
    revealed,
    multiplier: calculateMultiplier(revealed.length, mineCount),
    nextMultiplier: calculateMultiplier(revealed.length + 1, mineCount),
    status: game.status as "ACTIVE" | "WON" | "LOST",
    serverSeedHash: bet.serverSeedHash || "",
  };
}

async function saveGameToDb(userId: string, betId: string, gameState: MinesGameState): Promise<void> {
  const existing = await db
    .select()
    .from(minesGames)
    .where(eq(minesGames.betId, betId));
  
  if (existing.length > 0) {
    await db
      .update(minesGames)
      .set({
        revealed: JSON.stringify(gameState.revealed),
        status: gameState.status,
        updatedAt: new Date(),
      })
      .where(eq(minesGames.betId, betId));
  } else {
    await db
      .insert(minesGames)
      .values({
        betId,
        userId,
        minePositions: JSON.stringify(gameState.minePositions),
        mineCount: String(gameState.mineCount),
        revealed: JSON.stringify(gameState.revealed),
        status: gameState.status,
      });
  }
}

async function deleteGameFromDb(betId: string): Promise<void> {
  await db
    .delete(minesGames)
    .where(eq(minesGames.betId, betId));
}

export async function startMinesGame(request: StartMinesRequest): Promise<{
  success: boolean;
  game?: MinesGameState;
  error?: string;
}> {
  const { userId, betAmount, mineCount, clientSeed } = request;

  if (mineCount < MIN_MINES || mineCount > MAX_MINES) {
    return { success: false, error: `Número de minas deve ser entre ${MIN_MINES} e ${MAX_MINES}` };
  }

  const existingGame = await BetService.getActiveBet(userId, GameType.MINES);
  if (existingGame) {
    return { success: false, error: "Você já tem um jogo ativo" };
  }

  const betResult = await BetService.placeBet({
    userId,
    gameType: GameType.MINES,
    betAmount,
    gamePayload: { mineCount },
    clientSeed,
  });

  if (!betResult.success || !betResult.bet) {
    return { success: false, error: betResult.error };
  }

  const bet = betResult.bet;
  const minePositions = generateMinePositions(
    bet.serverSeed!,
    bet.clientSeed!,
    parseInt(bet.nonce || "0"),
    mineCount
  );

  const gameState: MinesGameState = {
    betId: bet.id,
    grid: Array(GRID_SIZE).fill(0),
    minePositions,
    mineCount,
    revealed: [],
    multiplier: 1,
    nextMultiplier: calculateMultiplier(1, mineCount),
    status: "ACTIVE",
    serverSeedHash: bet.serverSeedHash!,
  };

  await saveGameToDb(userId, bet.id, gameState);

  const safeResponse = {
    ...gameState,
    minePositions: undefined,
    serverSeedHash: gameState.serverSeedHash,
  };

  return { success: true, game: safeResponse as any };
}

export async function revealTile(request: RevealTileRequest): Promise<{
  success: boolean;
  game?: Partial<MinesGameState> & { hitMine?: boolean; revealedMines?: number[] };
  error?: string;
}> {
  const { userId, betId, tileIndex } = request;

  if (tileIndex < 0 || tileIndex >= GRID_SIZE) {
    return { success: false, error: "Posição inválida" };
  }

  let gameState = await getGameFromDb(betId, userId);

  if (!gameState) {
    const bet = await BetService.getBetById(betId, userId);
    if (!bet || bet.status !== BetStatus.ACTIVE) {
      return { success: false, error: "Jogo não encontrado ou já finalizado" };
    }

    const payload = bet.gamePayload ? JSON.parse(bet.gamePayload) : {};
    const minePositions = generateMinePositions(
      bet.serverSeed!,
      bet.clientSeed!,
      parseInt(bet.nonce || "0"),
      payload.mineCount || 3
    );

    gameState = {
      betId: bet.id,
      grid: Array(GRID_SIZE).fill(0),
      minePositions,
      mineCount: payload.mineCount || 3,
      revealed: payload.revealed || [],
      multiplier: payload.currentMultiplier || 1,
      nextMultiplier: calculateMultiplier((payload.revealed?.length || 0) + 1, payload.mineCount || 3),
      status: "ACTIVE",
      serverSeedHash: bet.serverSeedHash!,
    };

    await saveGameToDb(userId, betId, gameState);
  }

  if (gameState.status !== "ACTIVE") {
    return { success: false, error: "Jogo já finalizado" };
  }

  if (gameState.revealed.includes(tileIndex)) {
    return { success: false, error: "Posição já revelada" };
  }

  gameState.revealed.push(tileIndex);
  
  const hitMine = gameState.minePositions.includes(tileIndex);

  if (hitMine) {
    gameState.status = "LOST";

    await BetService.settleBet({
      betId,
      userId,
      won: false,
      multiplier: 0,
      gameResult: {
        minePositions: gameState.minePositions,
        revealed: gameState.revealed,
        hitTile: tileIndex,
      },
    });

    await deleteGameFromDb(betId);

    return {
      success: true,
      game: {
        betId: gameState.betId,
        revealed: gameState.revealed,
        multiplier: 0,
        status: "LOST",
        hitMine: true,
        revealedMines: gameState.minePositions,
        serverSeedHash: gameState.serverSeedHash,
      },
    };
  }

  gameState.multiplier = calculateMultiplier(gameState.revealed.length, gameState.mineCount);
  gameState.nextMultiplier = calculateMultiplier(gameState.revealed.length + 1, gameState.mineCount);

  if (gameState.revealed.length === GRID_SIZE - gameState.mineCount) {
    gameState.status = "WON";

    await BetService.settleBet({
      betId,
      userId,
      won: true,
      multiplier: gameState.multiplier,
      gameResult: {
        minePositions: gameState.minePositions,
        revealed: gameState.revealed,
        autoWin: true,
      },
    });

    await deleteGameFromDb(betId);

    return {
      success: true,
      game: {
        betId: gameState.betId,
        revealed: gameState.revealed,
        mineCount: gameState.mineCount,
        multiplier: gameState.multiplier,
        nextMultiplier: gameState.nextMultiplier,
        status: "WON",
        hitMine: false,
        revealedMines: gameState.minePositions,
        serverSeedHash: gameState.serverSeedHash,
      },
    };
  }

  await saveGameToDb(userId, betId, gameState);

  await db
    .update(bets)
    .set({
      gamePayload: JSON.stringify({
        mineCount: gameState.mineCount,
        revealed: gameState.revealed,
        currentMultiplier: gameState.multiplier,
      }),
      updatedAt: new Date(),
    })
    .where(eq(bets.id, betId));

  return {
    success: true,
    game: {
      betId: gameState.betId,
      revealed: gameState.revealed,
      mineCount: gameState.mineCount,
      multiplier: gameState.multiplier,
      nextMultiplier: gameState.nextMultiplier,
      status: "ACTIVE",
      hitMine: false,
      serverSeedHash: gameState.serverSeedHash,
    },
  };
}

export async function cashout(request: CashoutRequest): Promise<{
  success: boolean;
  winAmount?: number;
  minePositions?: number[];
  error?: string;
}> {
  const { userId, betId } = request;

  const gameState = await getGameFromDb(betId, userId);

  if (!gameState) {
    return { success: false, error: "Jogo não encontrado" };
  }

  if (gameState.status !== "ACTIVE") {
    return { success: false, error: "Jogo já finalizado" };
  }

  if (gameState.revealed.length === 0) {
    return { success: false, error: "Você precisa revelar pelo menos uma posição" };
  }

  const bet = await BetService.getBetById(betId, userId);
  if (!bet) {
    return { success: false, error: "Aposta não encontrada" };
  }

  const betAmount = parseFloat(bet.betAmount);
  const winAmount = betAmount * gameState.multiplier;

  await BetService.settleBet({
    betId,
    userId,
    won: true,
    multiplier: gameState.multiplier,
    gameResult: {
      minePositions: gameState.minePositions,
      revealed: gameState.revealed,
      cashedOut: true,
    },
  });

  await deleteGameFromDb(betId);

  return {
    success: true,
    winAmount,
    minePositions: gameState.minePositions,
  };
}

export async function getActiveGame(userId: string): Promise<{
  active: boolean;
  game?: Partial<MinesGameState>;
  betAmount?: string;
}> {
  const bet = await BetService.getActiveBet(userId, GameType.MINES);
  if (!bet) {
    return { active: false };
  }

  const gameState = await getGameFromDb(bet.id, userId);
  if (!gameState) {
    const payload = bet.gamePayload ? JSON.parse(bet.gamePayload) : {};
    const minePositions = generateMinePositions(
      bet.serverSeed!,
      bet.clientSeed!,
      parseInt(bet.nonce || "0"),
      payload.mineCount || 3
    );

    const newGameState: MinesGameState = {
      betId: bet.id,
      grid: Array(GRID_SIZE).fill(0),
      minePositions,
      mineCount: payload.mineCount || 3,
      revealed: payload.revealed || [],
      multiplier: calculateMultiplier((payload.revealed?.length || 0), payload.mineCount || 3),
      nextMultiplier: calculateMultiplier((payload.revealed?.length || 0) + 1, payload.mineCount || 3),
      status: "ACTIVE",
      serverSeedHash: bet.serverSeedHash!,
    };

    await saveGameToDb(userId, bet.id, newGameState);

    return {
      active: true,
      game: {
        betId: newGameState.betId,
        revealed: newGameState.revealed,
        mineCount: newGameState.mineCount,
        multiplier: newGameState.multiplier,
        nextMultiplier: newGameState.nextMultiplier,
        status: newGameState.status,
        serverSeedHash: newGameState.serverSeedHash,
      },
      betAmount: bet.betAmount,
    };
  }

  return {
    active: true,
    game: {
      betId: gameState.betId,
      revealed: gameState.revealed,
      mineCount: gameState.mineCount,
      multiplier: gameState.multiplier,
      nextMultiplier: gameState.nextMultiplier,
      status: gameState.status,
      serverSeedHash: gameState.serverSeedHash,
    },
    betAmount: bet.betAmount,
  };
}
