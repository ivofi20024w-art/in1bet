import { db } from "../../db";
import { 
  chatRooms, chatMessages, chatPenalties, chatReports, 
  chatBadWords, chatSettings, chatUserStatus, chatUserCustomization, chatUserBlocks, users,
  ChatRoom, ChatMessage, InsertChatRoom, InsertChatMessage
} from "@shared/schema";
import { eq, desc, and, gt, sql, asc } from "drizzle-orm";
import { moderateMessage, checkUserPenalty, applyPenalty, checkSpam, ChatViolationType } from "./chat.moderation";

export interface ChatUserCustomizationData {
  nameColor?: string;
  nameEffect?: string;
  messageColor?: string;
}

export interface ReplyToData {
  id: string;
  username: string;
  content: string;
}

export interface ChatMessageWithUser {
  id: string;
  message: string;
  createdAt: Date;
  isDeleted: boolean;
  user: {
    id: string;
    name: string;
    username?: string;
    vipLevel: string;
    level: number;
    role?: string;
    avatarUrl?: string | null;
    customization?: ChatUserCustomizationData | null;
  };
  replyTo?: ReplyToData;
}

export async function getUserCustomization(userId: string): Promise<ChatUserCustomizationData | null> {
  const [customization] = await db
    .select()
    .from(chatUserCustomization)
    .where(eq(chatUserCustomization.userId, userId));
  
  if (!customization) return null;
  
  return {
    nameColor: customization.nameColor || undefined,
    nameEffect: customization.nameEffect || undefined,
    messageColor: customization.messageColor || undefined,
  };
}

export async function getBlockedUsers(userId: string): Promise<string[]> {
  const blocks = await db
    .select({ blockedId: chatUserBlocks.blockedId })
    .from(chatUserBlocks)
    .where(eq(chatUserBlocks.blockerId, userId));
  
  return blocks.map(b => b.blockedId);
}

export async function initializeChatRooms() {
  const existingRooms = await db.select().from(chatRooms);
  
  if (existingRooms.length === 0) {
    const defaultRooms: InsertChatRoom[] = [
      { name: "global", displayName: "Chat Global", type: "GLOBAL", sortOrder: 0 },
      { name: "mines", displayName: "Mines", type: "GAME", gameType: "mines", sortOrder: 1 },
      { name: "crash", displayName: "Crash", type: "GAME", gameType: "crash", sortOrder: 2 },
      { name: "double", displayName: "Double", type: "GAME", gameType: "double", sortOrder: 3 },
      { name: "sports", displayName: "Esportes", type: "GAME", gameType: "sports", sortOrder: 4 },
      { name: "vip", displayName: "Sala VIP", type: "VIP", minVipLevel: "gold", sortOrder: 5 },
      { name: "highrollers", displayName: "High Rollers", type: "VIP", sortOrder: 6 },
      { name: "casino", displayName: "Casino", type: "GAME", gameType: "casino", sortOrder: 7 },
    ];
    
    await db.insert(chatRooms).values(defaultRooms);
    console.log("[CHAT] Default rooms initialized");
  }
}

export async function getChatRooms(userVipLevel?: string): Promise<ChatRoom[]> {
  const rooms = await db
    .select()
    .from(chatRooms)
    .where(eq(chatRooms.isActive, true))
    .orderBy(asc(chatRooms.sortOrder));
  
  if (!userVipLevel) {
    return rooms.filter(r => !r.minVipLevel);
  }
  
  const vipLevels = ["bronze", "silver", "gold", "platinum", "diamond"];
  const userVipIndex = vipLevels.indexOf(userVipLevel.toLowerCase());
  
  return rooms.filter(room => {
    if (!room.minVipLevel) return true;
    const roomVipIndex = vipLevels.indexOf(room.minVipLevel.toLowerCase());
    return userVipIndex >= roomVipIndex;
  });
}

export async function getRoomMessages(roomId: string, limit = 100): Promise<ChatMessageWithUser[]> {
  const messages = await db
    .select({
      id: chatMessages.id,
      message: chatMessages.message,
      createdAt: chatMessages.createdAt,
      isDeleted: chatMessages.isDeleted,
      userId: chatMessages.userId,
      userName: users.name,
      userUsername: users.username,
      userAvatarUrl: users.avatarUrl,
      userVipLevel: users.vipLevel,
      userLevel: users.level,
      replyToId: chatMessages.replyToId,
      replyToUsername: chatMessages.replyToUsername,
      replyToContent: chatMessages.replyToContent,
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.userId, users.id))
    .where(
      and(
        eq(chatMessages.roomId, roomId),
        eq(chatMessages.isDeleted, false)
      )
    )
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  
  return messages.reverse().map(m => ({
    id: m.id,
    message: m.message,
    createdAt: m.createdAt,
    isDeleted: m.isDeleted,
    user: {
      id: m.userId,
      name: m.userName,
      username: m.userUsername || undefined,
      vipLevel: m.userVipLevel || "bronze",
      level: m.userLevel,
      avatarUrl: m.userAvatarUrl || undefined,
    },
    replyTo: m.replyToId ? {
      id: m.replyToId,
      username: m.replyToUsername || "",
      content: m.replyToContent || "",
    } : undefined,
  }));
}

export interface SendMessageResult {
  success: boolean;
  message?: ChatMessageWithUser;
  error?: string;
  penalty?: {
    type: string;
    expiresAt?: Date;
  };
}

export async function sendMessage(
  userId: string,
  roomId: string,
  messageText: string,
  userName: string,
  userVipLevel: string,
  userLevel: number,
  userRole?: string,
  customization?: ChatUserCustomizationData | null,
  replyTo?: ReplyToData,
  userUsername?: string,
  userAvatarUrl?: string | null
): Promise<SendMessageResult> {
  const penaltyStatus = await checkUserPenalty(userId, roomId);
  
  if (penaltyStatus.isBanned) {
    return { 
      success: false, 
      error: penaltyStatus.reason || "Você foi banido do chat" 
    };
  }
  
  if (penaltyStatus.isMuted) {
    const remainingTime = penaltyStatus.expiresAt 
      ? Math.ceil((penaltyStatus.expiresAt.getTime() - Date.now()) / 1000 / 60)
      : null;
    return { 
      success: false, 
      error: remainingTime 
        ? `Você está silenciado por mais ${remainingTime} minuto(s)`
        : penaltyStatus.reason || "Você está temporariamente silenciado"
    };
  }
  
  if (checkSpam(userId)) {
    const penalty = await applyPenalty(userId, ChatViolationType.SPAM, messageText, roomId);
    return {
      success: false,
      error: "Você está enviando mensagens muito rápido. Aguarde um momento.",
      penalty: { type: penalty.penaltyType, expiresAt: penalty.expiresAt },
    };
  }
  
  const moderationResult = await moderateMessage(messageText);
  
  if (!moderationResult.allowed) {
    const mainViolation = moderationResult.violations[0];
    const penalty = await applyPenalty(userId, mainViolation.type, messageText, roomId);
    
    return {
      success: false,
      error: mainViolation.details,
      penalty: { type: penalty.penaltyType, expiresAt: penalty.expiresAt },
    };
  }
  
  const finalMessage = moderationResult.filteredMessage || messageText;
  
  const [newMessage] = await db
    .insert(chatMessages)
    .values({
      roomId,
      userId,
      message: finalMessage,
      replyToId: replyTo?.id || null,
      replyToUsername: replyTo?.username || null,
      replyToContent: replyTo?.content?.substring(0, 200) || null,
    })
    .returning();
  
  return {
    success: true,
    message: {
      id: newMessage.id,
      message: newMessage.message,
      createdAt: newMessage.createdAt,
      isDeleted: false,
      user: {
        id: userId,
        name: userName,
        username: userUsername,
        vipLevel: userVipLevel,
        level: userLevel,
        role: userRole,
        avatarUrl: userAvatarUrl,
        customization,
      },
      replyTo: replyTo,
    },
  };
}

export async function deleteMessage(
  messageId: string,
  deletedBy: string,
  reason?: string
): Promise<boolean> {
  const result = await db
    .update(chatMessages)
    .set({
      isDeleted: true,
      deletedBy,
      deletedReason: reason,
    })
    .where(eq(chatMessages.id, messageId))
    .returning();
  
  return result.length > 0;
}

export async function reportMessage(
  messageId: string,
  reporterId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const existingReport = await db
    .select()
    .from(chatReports)
    .where(
      and(
        eq(chatReports.messageId, messageId),
        eq(chatReports.reporterId, reporterId)
      )
    );
  
  if (existingReport.length > 0) {
    return { success: false, error: "Você já denunciou esta mensagem" };
  }
  
  await db.insert(chatReports).values({
    messageId,
    reporterId,
    reason,
  });
  
  return { success: true };
}

export async function updateUserOnlineStatus(
  userId: string,
  isOnline: boolean,
  currentRoomId?: string
) {
  const existing = await db
    .select()
    .from(chatUserStatus)
    .where(eq(chatUserStatus.userId, userId));
  
  if (existing.length > 0) {
    await db
      .update(chatUserStatus)
      .set({
        isOnline,
        currentRoomId: currentRoomId || null,
        lastSeenAt: new Date(),
      })
      .where(eq(chatUserStatus.userId, userId));
  } else {
    await db.insert(chatUserStatus).values({
      userId,
      isOnline,
      currentRoomId: currentRoomId || null,
    });
  }
}

export async function getOnlineUsers(roomId?: string): Promise<{ userId: string; name: string; vipLevel: string }[]> {
  const baseCondition = eq(chatUserStatus.isOnline, true);
  const condition = roomId 
    ? and(baseCondition, eq(chatUserStatus.currentRoomId, roomId))
    : baseCondition;
  
  const result = await db
    .select({
      userId: chatUserStatus.userId,
      name: users.name,
      vipLevel: users.vipLevel,
    })
    .from(chatUserStatus)
    .innerJoin(users, eq(chatUserStatus.userId, users.id))
    .where(condition)
    .limit(100);
  
  return result.map(u => ({
    userId: u.userId,
    name: u.name,
    vipLevel: u.vipLevel || "bronze",
  }));
}

export async function getSetting(key: string, defaultValue: string): Promise<string> {
  const [setting] = await db
    .select()
    .from(chatSettings)
    .where(eq(chatSettings.key, key));
  
  return setting?.value || defaultValue;
}

export async function updateSetting(key: string, value: string, description?: string) {
  const existing = await db
    .select()
    .from(chatSettings)
    .where(eq(chatSettings.key, key));
  
  if (existing.length > 0) {
    await db
      .update(chatSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(chatSettings.key, key));
  } else {
    await db.insert(chatSettings).values({
      key,
      value,
      description,
    });
  }
}
