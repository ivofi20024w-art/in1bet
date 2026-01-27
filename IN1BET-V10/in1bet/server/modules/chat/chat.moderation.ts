import { db } from "../../db";
import { chatBadWords, chatPenalties, chatSettings, ChatPenaltyType, ChatViolationType as SchemaViolationType } from "@shared/schema";
import { eq, and, gt, desc, sql } from "drizzle-orm";

export const ChatViolationType = SchemaViolationType;

const LINK_PATTERNS = [
  /https?:\/\/[^\s]+/gi,
  /www\.[^\s]+/gi,
  /[a-zA-Z0-9-]+\.(com|net|org|io|co|br|bet|casino|app|site|online|xyz|info|biz|me|tv|live|stream|link|click|win|top|club|vip|pro|money|cash|play|game|games|slots|poker|bet365|sportingbet|betano|pixbet|blaze|stake|pinnacle|betfair|1xbet|22bet|melbet|parimatch|mostbet|betway|leovegas|betsson|unibet|william\s*hill|bwin|ladbrokes|coral|paddy\s*power|888|pokerstars)[^\s]*/gi,
  /bit\.ly|goo\.gl|tinyurl|t\.co|shorturl|linktr\.ee|linktree|discord\.gg|telegram\.me|t\.me|wa\.me/gi,
  /\b[a-zA-Z0-9.-]+\s*(ponto|dot|\.)\s*(com|br|net|org|io)\b/gi,
];

const PHONE_PATTERNS = [
  /\+?55?\s*\(?\d{2}\)?\s*9?\d{4}[-.\s]?\d{4}/g,
  /\(?\d{2}\)?\s*9?\d{4}[-.\s]?\d{4}/g,
  /whats?\s*app?/gi,
  /zap\s*zap/gi,
  /chama\s*no\s*(zap|whats|telegram|privado|pv)/gi,
  /manda?\s*(msg|mensagem)\s*(no|pra)?\s*(zap|whats|telegram|privado|pv)/gi,
];

const SCAM_PATTERNS = [
  /ganhe\s*dinheiro\s*f[aá]cil/gi,
  /dinheiro\s*r[aá]pido/gi,
  /lucro\s*garantido/gi,
  /invista\s*agora/gi,
  /multiplique\s*seu\s*dinheiro/gi,
  /pix\s*gr[aá]tis/gi,
  /b[oô]nus\s*gr[aá]tis/gi,
  /rob[oô]\s*(de\s*)?(apostas?|trader|trading)/gi,
  /sinal\s*(vip|premium|pago)/gi,
  /grupo\s*vip/gi,
  /acesso\s*vip/gi,
  /m[eé]todo\s*infal[ií]vel/gi,
  /100%\s*garantido/gi,
  /deposite?\s*e\s*ganhe/gi,
];

const DEFAULT_BAD_WORDS = [
  "porra", "caralho", "merda", "foda", "fodase", "foda-se", "filhodaputa",
  "filho da puta", "arrombado", "viado", "viadinho", "cuzao", "cuzão",
  "buceta", "piroca", "pica", "rola", "pau no cu", "vai se foder",
  "desgraça", "desgraçado", "puta que pariu", "pqp", "vsf", "fdp",
  "cabaço", "otario", "otário", "babaca", "imbecil", "idiota", "retardado",
  "mongol", "debil", "débil", "lixo", "vagabundo", "vagaba",
];

interface BadWordEntry {
  word: string;
  severity: number;
}

let cachedBadWords: BadWordEntry[] | null = null;
let badWordsCacheTime = 0;
const BAD_WORDS_CACHE_TTL = 60000;

const SEVERITY_HIGH = 3;

async function getBadWords(): Promise<BadWordEntry[]> {
  const now = Date.now();
  if (cachedBadWords && (now - badWordsCacheTime) < BAD_WORDS_CACHE_TTL) {
    return cachedBadWords;
  }
  
  const dbWords = await db
    .select({ word: chatBadWords.word, severity: chatBadWords.severity })
    .from(chatBadWords)
    .where(eq(chatBadWords.isActive, true));
  
  cachedBadWords = dbWords.length > 0 
    ? dbWords.map(w => ({ word: w.word.toLowerCase(), severity: w.severity }))
    : DEFAULT_BAD_WORDS.map(w => ({ word: w, severity: 1 }));
  badWordsCacheTime = now;
  
  return cachedBadWords;
}

export function invalidateBadWordsCache() {
  cachedBadWords = null;
}

export interface ModerationResult {
  allowed: boolean;
  violations: {
    type: string;
    details: string;
  }[];
  filteredMessage?: string;
  instantBan?: boolean;
  banMessage?: string;
}

export async function moderateMessage(message: string): Promise<ModerationResult> {
  const violations: { type: string; details: string }[] = [];
  let filteredMessage = message;
  
  for (const pattern of LINK_PATTERNS) {
    if (pattern.test(message)) {
      violations.push({
        type: ChatViolationType.LINK,
        details: "Links não são permitidos no chat",
      });
      filteredMessage = filteredMessage.replace(pattern, "[link removido]");
    }
  }
  
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(message)) {
      violations.push({
        type: ChatViolationType.PHONE_NUMBER,
        details: "Números de telefone/WhatsApp não são permitidos",
      });
      filteredMessage = filteredMessage.replace(pattern, "[contato removido]");
    }
  }
  
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(message)) {
      violations.push({
        type: ChatViolationType.SCAM,
        details: "Mensagem identificada como possível golpe",
      });
      break;
    }
  }
  
  const badWords = await getBadWords();
  const lowerMessage = message.toLowerCase();
  let instantBan = false;
  
  for (const entry of badWords) {
    if (lowerMessage.includes(entry.word)) {
      if (entry.severity >= SEVERITY_HIGH) {
        instantBan = true;
        violations.push({
          type: ChatViolationType.SCAM,
          details: "Uso de linguagem proibida - violação grave",
        });
      } else {
        violations.push({
          type: ChatViolationType.PROFANITY,
          details: "Linguagem inapropriada detectada",
        });
      }
      const regex = new RegExp(entry.word, "gi");
      filteredMessage = filteredMessage.replace(regex, "*".repeat(entry.word.length));
    }
  }
  
  const hasBlockingViolation = violations.some(v => 
    v.type === ChatViolationType.LINK || 
    v.type === ChatViolationType.SCAM ||
    v.type === ChatViolationType.PHONE_NUMBER
  ) || instantBan;
  
  return {
    allowed: !hasBlockingViolation,
    violations,
    filteredMessage: violations.length > 0 ? filteredMessage : undefined,
    instantBan,
    banMessage: instantBan 
      ? "Você foi banido do chat por uso de linguagem proibida. Para contestar, abra um ticket de suporte ou use o chat ao vivo." 
      : undefined,
  };
}

export async function checkUserPenalty(userId: string, roomId?: string): Promise<{
  isMuted: boolean;
  isBanned: boolean;
  expiresAt?: Date;
  reason?: string;
}> {
  const now = new Date();
  
  const penalties = await db
    .select()
    .from(chatPenalties)
    .where(
      and(
        eq(chatPenalties.userId, userId),
        eq(chatPenalties.isActive, true)
      )
    )
    .orderBy(desc(chatPenalties.createdAt));
  
  for (const penalty of penalties) {
    if (penalty.roomId && roomId && penalty.roomId !== roomId) {
      continue;
    }
    
    if (penalty.expiresAt && penalty.expiresAt < now) {
      db.update(chatPenalties)
        .set({ isActive: false })
        .where(eq(chatPenalties.id, penalty.id))
        .execute()
        .catch(err => console.error("[CHAT] Error deactivating expired penalty:", err));
      continue;
    }
    
    if (penalty.penaltyType === ChatPenaltyType.BAN) {
      return {
        isMuted: false,
        isBanned: true,
        reason: penalty.reason || "Você foi banido do chat",
      };
    }
    
    if (
      penalty.penaltyType === ChatPenaltyType.MUTE_5MIN ||
      penalty.penaltyType === ChatPenaltyType.MUTE_1HOUR
    ) {
      return {
        isMuted: true,
        isBanned: false,
        expiresAt: penalty.expiresAt || undefined,
        reason: penalty.reason || "Você está temporariamente silenciado",
      };
    }
  }
  
  return { isMuted: false, isBanned: false };
}

export async function cleanupExpiredPenalties(): Promise<number> {
  const now = new Date();
  const result = await db
    .update(chatPenalties)
    .set({ isActive: false })
    .where(
      and(
        eq(chatPenalties.isActive, true),
        sql`${chatPenalties.expiresAt} IS NOT NULL AND ${chatPenalties.expiresAt} < ${now}`
      )
    )
    .returning();
  return result.length;
}

export async function getNextPenaltyType(userId: string): Promise<string> {
  const recentPenalties = await db
    .select()
    .from(chatPenalties)
    .where(
      and(
        eq(chatPenalties.userId, userId),
        gt(chatPenalties.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
      )
    )
    .orderBy(desc(chatPenalties.createdAt));
  
  const penaltyCount = recentPenalties.length;
  
  if (penaltyCount === 0) return ChatPenaltyType.WARNING;
  if (penaltyCount === 1) return ChatPenaltyType.MUTE_5MIN;
  if (penaltyCount === 2) return ChatPenaltyType.MUTE_1HOUR;
  return ChatPenaltyType.BAN;
}

export async function applyPenalty(
  userId: string,
  violationType: string,
  messageContent?: string,
  roomId?: string,
  issuedBy?: string
): Promise<{ penaltyType: string; expiresAt?: Date }> {
  const penaltyType = await getNextPenaltyType(userId);
  
  let expiresAt: Date | undefined;
  if (penaltyType === ChatPenaltyType.MUTE_5MIN) {
    expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  } else if (penaltyType === ChatPenaltyType.MUTE_1HOUR) {
    expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  }
  
  const reasonMap: Record<string, string> = {
    [ChatViolationType.LINK]: "Envio de links não permitidos",
    [ChatViolationType.PROFANITY]: "Uso de linguagem inapropriada",
    [ChatViolationType.SPAM]: "Spam ou flood no chat",
    [ChatViolationType.SCAM]: "Tentativa de golpe ou fraude",
    [ChatViolationType.PHONE_NUMBER]: "Compartilhamento de dados de contato",
    [ChatViolationType.MANUAL]: "Violação das regras do chat",
  };
  
  await db.insert(chatPenalties).values({
    userId,
    roomId: roomId || null,
    penaltyType,
    violationType,
    reason: reasonMap[violationType] || "Violação das regras",
    messageContent: messageContent?.substring(0, 500),
    expiresAt: expiresAt || null,
    isActive: true,
    issuedBy,
  });
  
  return { penaltyType, expiresAt };
}

export async function applyInstantBan(
  userId: string,
  violationType: string,
  messageContent?: string,
  roomId?: string,
  issuedBy?: string
): Promise<void> {
  console.log(`[CHAT] Applying instant ban to user ${userId} for violation: ${violationType}`);
  
  await db.insert(chatPenalties).values({
    userId,
    roomId: roomId || null,
    penaltyType: ChatPenaltyType.BAN,
    violationType,
    reason: "Uso de linguagem proibida - violação grave. Para contestar, abra um ticket de suporte.",
    messageContent: messageContent?.substring(0, 500),
    expiresAt: null,
    isActive: true,
    issuedBy,
  });
}

const userMessageTimestamps = new Map<string, number[]>();
const SPAM_WINDOW_MS = 10000;
const MAX_MESSAGES_PER_WINDOW = 5;

export function checkSpam(userId: string): boolean {
  const now = Date.now();
  const timestamps = userMessageTimestamps.get(userId) || [];
  
  const recentTimestamps = timestamps.filter(t => now - t < SPAM_WINDOW_MS);
  
  recentTimestamps.push(now);
  userMessageTimestamps.set(userId, recentTimestamps);
  
  return recentTimestamps.length > MAX_MESSAGES_PER_WINDOW;
}

export function clearSpamTracker(userId: string) {
  userMessageTimestamps.delete(userId);
}
