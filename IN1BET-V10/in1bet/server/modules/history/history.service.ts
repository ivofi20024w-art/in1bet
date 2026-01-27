import { db } from "../../db";
import {
  transactions,
  bets,
  pixWithdrawals,
  pixDeposits,
  userBonuses,
  bonuses,
  users,
  TransactionType,
  slotsgatewayTransactions,
  slotsgatewayGames,
  SlotsgatewayTransactionType,
} from "@shared/schema";
import { eq, desc, and, or, sql, gte, lte, gt, inArray } from "drizzle-orm";

type Transaction = typeof transactions.$inferSelect;
type Bet = typeof bets.$inferSelect;
type PixWithdrawal = typeof pixWithdrawals.$inferSelect;
type PixDeposit = typeof pixDeposits.$inferSelect;

export interface HistoryItem {
  id: string;
  type: "transaction" | "bet" | "withdrawal" | "deposit" | "bonus";
  category: string;
  description: string;
  amount: number;
  profit?: number;
  status: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface HistoryFilters {
  type?: "all" | "transactions" | "bets" | "withdrawals" | "deposits" | "bonuses";
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedHistory {
  items: HistoryItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

function mapTransactionToHistoryItem(tx: Transaction): HistoryItem {
  const categoryMap: Record<string, string> = {
    [TransactionType.DEPOSIT]: "Depósito",
    [TransactionType.WITHDRAW]: "Saque",
    [TransactionType.WITHDRAW_RESERVE]: "Saque Reservado",
    [TransactionType.WITHDRAW_RELEASE]: "Saque Liberado",
    [TransactionType.BET]: "Aposta",
    [TransactionType.WIN]: "Ganho",
    [TransactionType.ROLLBACK]: "Estorno",
    [TransactionType.BONUS]: "Bônus",
    [TransactionType.BONUS_CREDIT]: "Crédito de Bônus",
    [TransactionType.BONUS_CONVERT]: "Conversão de Bônus",
    [TransactionType.ROLLOVER_CONSUME]: "Rollover",
  };

  return {
    id: tx.id,
    type: "transaction",
    category: categoryMap[tx.type] || tx.type,
    description: tx.description || categoryMap[tx.type] || tx.type,
    amount: parseFloat(tx.amount),
    status: tx.status,
    createdAt: tx.createdAt,
    metadata: tx.metadata ? JSON.parse(tx.metadata) : undefined,
  };
}

function mapBetToHistoryItem(bet: Bet): HistoryItem {
  const statusMap: Record<string, string> = {
    PENDING: "Pendente",
    ACTIVE: "Em Andamento",
    WON: "Ganho",
    LOST: "Perdido",
    CANCELLED: "Cancelado",
    TIMEOUT: "Expirado",
  };

  const gameTypeMap: Record<string, string> = {
    MINES: "Mines",
    CRASH: "Crash",
    PLINKO: "Plinko",
    DOUBLE: "Double",
    SLOTS: "Slots",
    SPORTS: "Esportes",
  };

  const isWin = bet.status === "WON";
  const displayAmount = isWin ? parseFloat(bet.winAmount) : parseFloat(bet.betAmount);

  return {
    id: bet.id,
    type: "bet",
    category: gameTypeMap[bet.gameType] || bet.gameType,
    description: `${gameTypeMap[bet.gameType] || bet.gameType} - ${statusMap[bet.status] || bet.status}`,
    amount: displayAmount,
    profit: parseFloat(bet.profit),
    status: statusMap[bet.status] || bet.status,
    createdAt: bet.createdAt,
    metadata: {
      gameType: bet.gameType,
      betAmount: parseFloat(bet.betAmount),
      multiplier: parseFloat(bet.multiplier),
      serverSeedHash: bet.serverSeedHash,
    },
  };
}

function mapWithdrawalToHistoryItem(withdrawal: PixWithdrawal): HistoryItem {
  const statusMap: Record<string, string> = {
    PENDING: "Pendente",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    PAID: "Pago",
  };

  return {
    id: withdrawal.id,
    type: "withdrawal",
    category: "Saque PIX",
    description: `Saque PIX - ${statusMap[withdrawal.status] || withdrawal.status}`,
    amount: -parseFloat(withdrawal.amount),
    status: statusMap[withdrawal.status] || withdrawal.status,
    createdAt: withdrawal.createdAt,
    metadata: {
      pixKeyType: withdrawal.pixKeyType,
      paidAt: withdrawal.paidAt,
    },
  };
}

function mapDepositToHistoryItem(deposit: PixDeposit): HistoryItem {
  const statusMap: Record<string, string> = {
    PENDING: "Pendente",
    PAID: "Confirmado",
    EXPIRED: "Expirado",
    CANCELLED: "Cancelado",
  };

  return {
    id: deposit.id,
    type: "deposit",
    category: "Depósito PIX",
    description: `Depósito PIX - ${statusMap[deposit.status] || deposit.status}`,
    amount: parseFloat(deposit.amount),
    status: statusMap[deposit.status] || deposit.status,
    createdAt: deposit.createdAt,
    metadata: {
      externalId: deposit.externalId,
      paidAt: deposit.paidAt,
    },
  };
}

type SlotsgatewayTx = typeof slotsgatewayTransactions.$inferSelect;

function mapSlotsgatewayToHistoryItem(tx: SlotsgatewayTx, gameName?: string): HistoryItem {
  const isBet = tx.transactionType === SlotsgatewayTransactionType.BET;
  const isWin = tx.transactionType === SlotsgatewayTransactionType.WIN;
  const displayName = gameName || "Slots";
  
  let status = "Pendente";
  let amount = 0;
  let profit = 0;
  
  if (isBet) {
    status = "Aposta";
    amount = parseFloat(tx.betAmount || "0");
    profit = -amount;
  } else if (isWin) {
    status = "Ganho";
    amount = parseFloat(tx.winAmount || "0");
    profit = amount;
  } else if (tx.transactionType === SlotsgatewayTransactionType.REFUND) {
    status = "Estorno";
    amount = parseFloat(tx.winAmount || "0");
    profit = amount;
  }

  return {
    id: tx.id,
    type: "bet",
    category: displayName,
    description: `${displayName} - ${status}`,
    amount,
    profit,
    status,
    createdAt: tx.createdAt,
    metadata: {
      gameType: "SLOTS",
      gameIdHash: tx.gameIdHash,
      roundId: tx.roundId,
      transactionType: tx.transactionType,
      externalTransactionId: tx.externalTransactionId,
    },
  };
}

export async function getUnifiedHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  filters?: HistoryFilters
): Promise<PaginatedHistory> {
  const filterType = filters?.type || "all";
  
  const countPromises: Promise<number>[] = [];
  const dataPromises: Promise<HistoryItem[]>[] = [];

  if (filterType === "all" || filterType === "bets") {
    countPromises.push(
      db.select({ count: sql<number>`count(*)::int` })
        .from(bets)
        .where(eq(bets.userId, userId))
        .then(r => r[0]?.count || 0)
    );
    dataPromises.push(
      db.select()
        .from(bets)
        .where(eq(bets.userId, userId))
        .orderBy(desc(bets.createdAt))
        .limit(limit + offset + 50)
        .then(r => r.map(mapBetToHistoryItem))
    );

    const slotsWhereClause = and(
      eq(slotsgatewayTransactions.userId, userId),
      or(
        eq(slotsgatewayTransactions.transactionType, SlotsgatewayTransactionType.BET),
        eq(slotsgatewayTransactions.transactionType, SlotsgatewayTransactionType.WIN)
      )
    );
    countPromises.push(
      db.select({ count: sql<number>`count(*)::int` })
        .from(slotsgatewayTransactions)
        .where(slotsWhereClause)
        .then(r => r[0]?.count || 0)
    );
    dataPromises.push(
      db.select()
        .from(slotsgatewayTransactions)
        .where(slotsWhereClause)
        .orderBy(desc(slotsgatewayTransactions.createdAt))
        .limit(limit + offset + 50)
        .then(async (txs) => {
          const gameIdHashes = txs
            .map(tx => tx.gameIdHash)
            .filter((hash): hash is string => !!hash);
          
          let gameNames: Map<string, string> = new Map();
          if (gameIdHashes.length > 0) {
            const uniqueHashes = [...new Set(gameIdHashes)];
            const games = await db
              .select({ idHash: slotsgatewayGames.idHash, name: slotsgatewayGames.name })
              .from(slotsgatewayGames)
              .where(inArray(slotsgatewayGames.idHash, uniqueHashes));
            games.forEach(g => gameNames.set(g.idHash, g.name));
          }
          
          return txs.map(tx => 
            mapSlotsgatewayToHistoryItem(tx, tx.gameIdHash ? gameNames.get(tx.gameIdHash) : undefined)
          );
        })
    );
  }

  if (filterType === "all" || filterType === "withdrawals") {
    countPromises.push(
      db.select({ count: sql<number>`count(*)::int` })
        .from(pixWithdrawals)
        .where(eq(pixWithdrawals.userId, userId))
        .then(r => r[0]?.count || 0)
    );
    dataPromises.push(
      db.select()
        .from(pixWithdrawals)
        .where(eq(pixWithdrawals.userId, userId))
        .orderBy(desc(pixWithdrawals.createdAt))
        .limit(limit + offset + 50)
        .then(r => r.map(mapWithdrawalToHistoryItem))
    );
  }

  if (filterType === "all" || filterType === "deposits") {
    countPromises.push(
      db.select({ count: sql<number>`count(*)::int` })
        .from(pixDeposits)
        .where(eq(pixDeposits.userId, userId))
        .then(r => r[0]?.count || 0)
    );
    dataPromises.push(
      db.select()
        .from(pixDeposits)
        .where(eq(pixDeposits.userId, userId))
        .orderBy(desc(pixDeposits.createdAt))
        .limit(limit + offset + 50)
        .then(r => r.map(mapDepositToHistoryItem))
    );
  }

  if (filterType === "all" || filterType === "transactions") {
    const txWhereClause = and(
      eq(transactions.userId, userId),
      or(
        eq(transactions.type, TransactionType.BONUS),
        eq(transactions.type, TransactionType.BONUS_CREDIT),
        eq(transactions.type, TransactionType.BONUS_CONVERT),
        eq(transactions.type, TransactionType.ROLLBACK)
      )
    );
    countPromises.push(
      db.select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(txWhereClause)
        .then(r => r[0]?.count || 0)
    );
    dataPromises.push(
      db.select()
        .from(transactions)
        .where(txWhereClause)
        .orderBy(desc(transactions.createdAt))
        .limit(limit + offset + 50)
        .then(r => r.map(mapTransactionToHistoryItem))
    );
  }

  const [counts, dataArrays] = await Promise.all([
    Promise.all(countPromises),
    Promise.all(dataPromises),
  ]);

  const total = counts.reduce((sum, c) => sum + c, 0);
  const items = dataArrays.flat();

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const paginatedItems = items.slice(offset, offset + limit);

  return {
    items: paginatedItems,
    total,
    limit,
    offset,
    hasMore: offset + paginatedItems.length < total,
  };
}

interface BetFilters {
  gameType?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export async function getBetHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  filters?: BetFilters
): Promise<PaginatedHistory> {
  const conditions: any[] = [eq(bets.userId, userId)];
  
  if (filters?.gameType && filters.gameType !== "SLOTS") {
    conditions.push(eq(bets.gameType, filters.gameType));
  }
  if (filters?.status) {
    conditions.push(eq(bets.status, filters.status));
  }
  if (filters?.startDate) {
    conditions.push(gte(bets.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(bets.createdAt, filters.endDate));
  }
  if (filters?.minAmount !== undefined) {
    conditions.push(sql`CAST(${bets.betAmount} AS NUMERIC) >= ${filters.minAmount}`);
  }
  if (filters?.maxAmount !== undefined) {
    conditions.push(sql`CAST(${bets.betAmount} AS NUMERIC) <= ${filters.maxAmount}`);
  }

  const whereClause = and(...conditions);

  const slotsConditions: any[] = [
    eq(slotsgatewayTransactions.userId, userId),
    or(
      eq(slotsgatewayTransactions.transactionType, SlotsgatewayTransactionType.BET),
      eq(slotsgatewayTransactions.transactionType, SlotsgatewayTransactionType.WIN)
    )
  ];
  
  if (filters?.startDate) {
    slotsConditions.push(gte(slotsgatewayTransactions.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    slotsConditions.push(lte(slotsgatewayTransactions.createdAt, filters.endDate));
  }

  const slotsWhereClause = and(...slotsConditions);

  const includeSlots = !filters?.gameType || filters.gameType === "SLOTS";
  const includeOriginal = !filters?.gameType || filters.gameType !== "SLOTS";

  const [originalBets, originalCount, slotsTxs, slotsCount] = await Promise.all([
    includeOriginal ? db
      .select()
      .from(bets)
      .where(whereClause)
      .orderBy(desc(bets.createdAt))
      .limit(limit + offset + 100) : Promise.resolve([]),
    includeOriginal ? db
      .select({ count: sql<number>`count(*)::int` })
      .from(bets)
      .where(whereClause) : Promise.resolve([{ count: 0 }]),
    includeSlots ? db
      .select()
      .from(slotsgatewayTransactions)
      .where(slotsWhereClause)
      .orderBy(desc(slotsgatewayTransactions.createdAt))
      .limit(limit + offset + 100) : Promise.resolve([]),
    includeSlots ? db
      .select({ count: sql<number>`count(*)::int` })
      .from(slotsgatewayTransactions)
      .where(slotsWhereClause) : Promise.resolve([{ count: 0 }]),
  ]);

  const gameIdHashes = slotsTxs
    .map(tx => tx.gameIdHash)
    .filter((hash): hash is string => !!hash);
  
  let gameNames: Map<string, string> = new Map();
  if (gameIdHashes.length > 0) {
    const uniqueHashes = [...new Set(gameIdHashes)];
    const games = await db
      .select({ idHash: slotsgatewayGames.idHash, name: slotsgatewayGames.name })
      .from(slotsgatewayGames)
      .where(inArray(slotsgatewayGames.idHash, uniqueHashes));
    
    games.forEach(g => gameNames.set(g.idHash, g.name));
  }

  const originalItems = originalBets.map(mapBetToHistoryItem);
  const slotsItems = slotsTxs.map(tx => 
    mapSlotsgatewayToHistoryItem(tx, tx.gameIdHash ? gameNames.get(tx.gameIdHash) : undefined)
  );

  const allItems = [...originalItems, ...slotsItems];
  allItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const paginatedItems = allItems.slice(offset, offset + limit);
  const total = (originalCount[0]?.count || 0) + (slotsCount[0]?.count || 0);

  return {
    items: paginatedItems,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  type?: string
): Promise<PaginatedHistory> {
  const whereClause = type
    ? and(eq(transactions.userId, userId), eq(transactions.type, type))
    : eq(transactions.userId, userId);

  const [results, countResult] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(whereClause)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count || 0;

  return {
    items: results.map(mapTransactionToHistoryItem),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

export async function getWithdrawalHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedHistory> {
  const [results, countResult] = await Promise.all([
    db
      .select()
      .from(pixWithdrawals)
      .where(eq(pixWithdrawals.userId, userId))
      .orderBy(desc(pixWithdrawals.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(pixWithdrawals)
      .where(eq(pixWithdrawals.userId, userId)),
  ]);

  const total = countResult[0]?.count || 0;

  return {
    items: results.map(mapWithdrawalToHistoryItem),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

export async function getDepositHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedHistory> {
  const [results, countResult] = await Promise.all([
    db
      .select()
      .from(pixDeposits)
      .where(eq(pixDeposits.userId, userId))
      .orderBy(desc(pixDeposits.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(pixDeposits)
      .where(eq(pixDeposits.userId, userId)),
  ]);

  const total = countResult[0]?.count || 0;

  return {
    items: results.map(mapDepositToHistoryItem),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

export async function getUserStats(userId: string): Promise<{
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  netProfit: number;
  biggestWin: number;
  totalDeposits: number;
  totalWithdrawals: number;
}> {
  const [betStats] = await db
    .select({
      totalBets: sql<number>`count(*)::int`,
      totalWins: sql<number>`count(*) filter (where status = 'WON')::int`,
      totalLosses: sql<number>`count(*) filter (where status = 'LOST')::int`,
      netProfit: sql<number>`coalesce(sum(profit::numeric), 0)::float`,
      biggestWin: sql<number>`coalesce(max(case when status = 'WON' then win_amount::numeric else 0 end), 0)::float`,
    })
    .from(bets)
    .where(eq(bets.userId, userId));

  const [depositStats] = await db
    .select({
      total: sql<number>`coalesce(sum(amount::numeric) filter (where status = 'PAID'), 0)::float`,
    })
    .from(pixDeposits)
    .where(eq(pixDeposits.userId, userId));

  const [withdrawalStats] = await db
    .select({
      total: sql<number>`coalesce(sum(amount::numeric) filter (where status = 'PAID'), 0)::float`,
    })
    .from(pixWithdrawals)
    .where(eq(pixWithdrawals.userId, userId));

  return {
    totalBets: betStats?.totalBets || 0,
    totalWins: betStats?.totalWins || 0,
    totalLosses: betStats?.totalLosses || 0,
    netProfit: betStats?.netProfit || 0,
    biggestWin: betStats?.biggestWin || 0,
    totalDeposits: depositStats?.total || 0,
    totalWithdrawals: withdrawalStats?.total || 0,
  };
}

export interface RecentWinner {
  id: string;
  username: string;
  level: number;
  amount: number | null;
  gameName: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export async function getRecentWinners(limit: number = 20): Promise<RecentWinner[]> {
  const recentWins = await db
    .select({
      id: bets.id,
      username: users.username,
      name: users.name,
      level: users.level,
      amount: sql<number>`${bets.winAmount}::float`,
      gameType: bets.gameType,
      avatarUrl: users.avatarUrl,
      hideWins: users.hideWins,
      createdAt: bets.updatedAt,
    })
    .from(bets)
    .innerJoin(users, eq(bets.userId, users.id))
    .where(
      and(
        eq(bets.status, 'WON'),
        gt(sql`${bets.winAmount}::numeric`, 0)
      )
    )
    .orderBy(desc(bets.updatedAt))
    .limit(limit);

  const gameTypeNames: Record<string, string> = {
    MINES: 'Mines',
    CRASH: 'Crash',
    PLINKO: 'Plinko',
    DOUBLE: 'Double',
    SLOTS: 'Slots',
    SPORTS: 'Esportes',
  };

  return recentWins.map(win => ({
    id: win.id,
    username: win.username || win.name.split(' ')[0],
    level: win.level,
    amount: win.hideWins ? null : win.amount,
    gameName: gameTypeNames[win.gameType] || win.gameType,
    avatarUrl: win.avatarUrl,
    createdAt: win.createdAt,
  }));
}
