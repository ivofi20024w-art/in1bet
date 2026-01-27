import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { 
  sendMessage, 
  updateUserOnlineStatus, 
  getRoomMessages, 
  getChatRooms,
  ChatMessageWithUser,
  getUserCustomization,
  getBlockedUsers,
  deleteMessage
} from "./chat.service";
import { db } from "../../db";
import { users, chatUserCustomization, chatUserBlocks, chatPenalties, wallets, transactions, TransactionType, TransactionStatus, chatMessages } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

interface JWTPayload {
  userId: string;
  email: string;
}

function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn("[CHAT WS] JWT_SECRET not configured");
      return null;
    }
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    return null;
  }
}

interface ChatClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  userUsername?: string;
  userAvatarUrl?: string | null;
  userVipLevel: string;
  userLevel: number;
  userRole: string;
  isAdmin: boolean;
  currentRoomId: string | null;
  customization: { nameColor?: string; nameEffect?: string; messageColor?: string } | null;
  blockedUsers: string[];
  isTyping: boolean;
  typingTimeout: NodeJS.Timeout | null;
  isAlive: boolean;
  lastPing: number;
}

const clients = new Map<string, ChatClient>();
const roomSubscriptions = new Map<string, Set<string>>();

export function setupChatWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    noServer: true, 
    perMessageDeflate: false 
  });
  
  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
    
    if (pathname === "/ws/chat") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  const PING_INTERVAL = 30000;
  const pingInterval = setInterval(() => {
    const now = Date.now();
    clients.forEach((client, clientId) => {
      if (!client.isAlive) {
        console.log(`[CHAT WS] Client ${clientId} did not respond to ping, terminating`);
        client.ws.terminate();
        return;
      }
      client.isAlive = false;
      client.lastPing = now;
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({ type: "ping", timestamp: now }));
      }
    });
  }, PING_INTERVAL);

  wss.on("close", () => {
    clearInterval(pingInterval);
  });

  wss.on("connection", async (ws, req) => {
    let clientId: string | null = null;
    const connectionId = randomUUID().slice(0, 8);
    console.log(`[CHAT WS][${connectionId}] New WebSocket connection from ${req.socket.remoteAddress}`);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`[CHAT WS][${connectionId}] Message received: type=${message.type}, clientId=${clientId || 'not_authenticated'}`);
        
        if (clientId) {
          const client = clients.get(clientId);
          if (client) {
            client.isAlive = true;
          }
        }
        
        switch (message.type) {
          case "auth": {
            console.log(`[CHAT WS][${connectionId}] Auth attempt with token: ${message.token ? message.token.slice(0, 20) + '...' : 'NONE'}`);
            const token = message.token;
            const decoded = verifyAccessToken(token);
            
            if (!decoded) {
              console.log(`[CHAT WS][${connectionId}] Auth FAILED - token invalid or expired`);
              // Send error but don't close - let client try to refresh token
              ws.send(JSON.stringify({ type: "auth_failed", error: "Token inválido ou expirado" }));
              // Give client 10 seconds to send a new auth with refreshed token
              setTimeout(() => {
                if (!clientId && ws.readyState === WebSocket.OPEN) {
                  console.log(`[CHAT WS][${connectionId}] Closing connection - no re-auth after 10s`);
                  ws.close();
                }
              }, 10000);
              return;
            }
            console.log(`[CHAT WS][${connectionId}] Token decoded, userId=${decoded.userId}`);

            const [user] = await db
              .select()
              .from(users)
              .where(eq(users.id, decoded.userId));

            if (!user) {
              ws.send(JSON.stringify({ type: "error", error: "Usuário não encontrado" }));
              ws.close();
              return;
            }

            const customization = await getUserCustomization(user.id);
            const blockedUsers = await getBlockedUsers(user.id);

            clientId = user.id;
            console.log(`[CHAT WS][${connectionId}] User found: ${user.name} (id=${user.id}, vip=${user.vipLevel}, level=${user.level})`);
            clients.set(clientId, {
              ws,
              userId: user.id,
              userName: user.name,
              userUsername: user.username || undefined,
              userAvatarUrl: user.avatarUrl || undefined,
              userVipLevel: user.vipLevel || "bronze",
              userLevel: user.level,
              userRole: user.chatModeratorRole || "NONE",
              isAdmin: user.isAdmin || false,
              currentRoomId: null,
              customization,
              blockedUsers,
              isTyping: false,
              typingTimeout: null,
              isAlive: true,
              lastPing: Date.now(),
            });

            await updateUserOnlineStatus(user.id, true);

            const rooms = await getChatRooms(user.vipLevel || "bronze");
            console.log(`[CHAT WS][${connectionId}] Auth SUCCESS - sending authenticated response with ${rooms.length} rooms`);
            ws.send(JSON.stringify({ 
              type: "authenticated", 
              userId: user.id,
              userName: user.name,
              vipLevel: user.vipLevel || "bronze",
              userRole: user.chatModeratorRole || "NONE",
              isAdmin: user.isAdmin || false,
              level: user.level,
              customization,
              rooms 
            }));
            
            broadcastOnlineCount();
            break;
          }

          case "join_room": {
            console.log(`[CHAT WS][${connectionId}] join_room request: roomId=${message.roomId}`);
            if (!clientId) {
              console.log(`[CHAT WS][${connectionId}] join_room FAILED - not authenticated`);
              ws.send(JSON.stringify({ type: "error", error: "Não autenticado" }));
              return;
            }

            const client = clients.get(clientId);
            if (!client) {
              console.log(`[CHAT WS][${connectionId}] join_room FAILED - client not found in map`);
              return;
            }

            const roomId = message.roomId;
            
            // High Rollers room validation - require level 50+
            if (roomId === 'highrollers' && client.userLevel < 50) {
              ws.send(JSON.stringify({ 
                type: "join_room_error", 
                error: "Você precisa ser Nível 50+ para acessar a sala High Rollers",
                requiredLevel: 50,
                currentLevel: client.userLevel
              }));
              return;
            }
            
            if (client.currentRoomId) {
              const oldRoomSubs = roomSubscriptions.get(client.currentRoomId);
              if (oldRoomSubs) {
                oldRoomSubs.delete(clientId);
                broadcastRoomOnlineCount(client.currentRoomId);
              }
            }

            client.currentRoomId = roomId;
            
            if (!roomSubscriptions.has(roomId)) {
              roomSubscriptions.set(roomId, new Set());
            }
            roomSubscriptions.get(roomId)!.add(clientId);

            await updateUserOnlineStatus(clientId, true, roomId);

            const messages = await getRoomMessages(roomId, 100);
            const roomOnlineCount = roomSubscriptions.get(roomId)?.size || 0;
            
            console.log(`[CHAT WS][${connectionId}] room_joined SUCCESS: roomId=${roomId}, messages=${messages.length}, online=${roomOnlineCount}`);
            ws.send(JSON.stringify({ 
              type: "room_joined", 
              roomId,
              messages,
              onlineCount: roomOnlineCount
            }));

            broadcastToRoom(roomId, {
              type: "user_joined",
              userId: client.userId,
              userName: client.userName,
              vipLevel: client.userVipLevel,
              level: client.userLevel,
              role: client.userRole,
            }, clientId);
            
            broadcastRoomOnlineCount(roomId);
            break;
          }

          case "send_message": {
            console.log(`[CHAT WS][${connectionId}] send_message request: message="${message.message?.slice(0, 50)}..."`);
            if (!clientId) {
              console.log(`[CHAT WS][${connectionId}] send_message FAILED - not authenticated`);
              ws.send(JSON.stringify({ type: "error", error: "Não autenticado" }));
              return;
            }

            const client = clients.get(clientId);
            if (!client || !client.currentRoomId) {
              console.log(`[CHAT WS][${connectionId}] send_message FAILED - no room joined (currentRoomId=${client?.currentRoomId})`);
              ws.send(JSON.stringify({ type: "error", error: "Entre em uma sala primeiro" }));
              return;
            }
            console.log(`[CHAT WS][${connectionId}] send_message: user=${client.userName}, room=${client.currentRoomId}`);

            if (client.isTyping) {
              client.isTyping = false;
              if (client.typingTimeout) {
                clearTimeout(client.typingTimeout);
                client.typingTimeout = null;
              }
              broadcastTypingStatus(client.currentRoomId, clientId, false);
            }

            // Extract replyTo data from message
            const replyTo = message.replyTo ? {
              id: message.replyTo.id,
              username: message.replyTo.username,
              content: message.replyTo.content?.substring(0, 100)
            } : undefined;

            console.log(`[CHAT WS][${connectionId}] Calling sendMessage service...`);
            const result = await sendMessage(
              client.userId,
              client.currentRoomId,
              message.message,
              client.userName,
              client.userVipLevel,
              client.userLevel,
              client.userRole,
              client.customization,
              replyTo,
              client.userUsername,
              client.userAvatarUrl
            );

            if (!result.success) {
              console.log(`[CHAT WS][${connectionId}] send_message FAILED from service: ${result.error}`);
              ws.send(JSON.stringify({ 
                type: "message_error", 
                error: result.error,
                penalty: result.penalty 
              }));
              return;
            }

            if (result.message) {
              console.log(`[CHAT WS][${connectionId}] send_message SUCCESS - broadcasting to room ${client.currentRoomId}`);
              broadcastToRoom(client.currentRoomId, {
                type: "new_message",
                message: result.message,
              });
            }
            break;
          }

          case "typing": {
            if (!clientId) return;

            const client = clients.get(clientId);
            if (!client || !client.currentRoomId) return;

            if (!client.isTyping) {
              client.isTyping = true;
              broadcastTypingStatus(client.currentRoomId, clientId, true, client.userName);
            }

            if (client.typingTimeout) {
              clearTimeout(client.typingTimeout);
            }

            client.typingTimeout = setTimeout(() => {
              if (client.isTyping) {
                client.isTyping = false;
                broadcastTypingStatus(client.currentRoomId!, clientId!, false);
              }
            }, 3000);
            break;
          }

          case "stop_typing": {
            if (!clientId) return;

            const client = clients.get(clientId);
            if (!client || !client.currentRoomId) return;

            if (client.isTyping) {
              client.isTyping = false;
              if (client.typingTimeout) {
                clearTimeout(client.typingTimeout);
                client.typingTimeout = null;
              }
              broadcastTypingStatus(client.currentRoomId, clientId, false);
            }
            break;
          }

          case "block_user": {
            if (!clientId) return;
            
            const client = clients.get(clientId);
            if (!client) return;

            const targetUserId = message.userId;
            if (!client.blockedUsers.includes(targetUserId)) {
              await db.insert(chatUserBlocks).values({
                blockerId: clientId,
                blockedId: targetUserId,
              }).onConflictDoNothing();
              
              client.blockedUsers.push(targetUserId);
              ws.send(JSON.stringify({ type: "user_blocked", userId: targetUserId }));
            }
            break;
          }

          case "unblock_user": {
            if (!clientId) return;
            
            const client = clients.get(clientId);
            if (!client) return;

            const targetUserId = message.userId;
            await db.delete(chatUserBlocks)
              .where(and(
                eq(chatUserBlocks.blockerId, clientId),
                eq(chatUserBlocks.blockedId, targetUserId)
              ));
            
            client.blockedUsers = client.blockedUsers.filter(id => id !== targetUserId);
            ws.send(JSON.stringify({ type: "user_unblocked", userId: targetUserId }));
            break;
          }

          case "leave_room": {
            if (!clientId) return;

            const client = clients.get(clientId);
            if (!client || !client.currentRoomId) return;

            const roomId = client.currentRoomId;
            const roomSubs = roomSubscriptions.get(roomId);
            if (roomSubs) {
              roomSubs.delete(clientId);
            }

            broadcastToRoom(roomId, {
              type: "user_left",
              userId: client.userId,
              userName: client.userName,
            }, clientId);

            client.currentRoomId = null;
            await updateUserOnlineStatus(clientId, true, undefined);
            broadcastRoomOnlineCount(roomId);
            break;
          }

          case "ping": {
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
            break;
          }

          case "pong": {
            if (clientId) {
              const client = clients.get(clientId);
              if (client) {
                client.isAlive = true;
              }
            }
            break;
          }

          // Admin action: Delete message
          case "admin_delete_message": {
            if (!clientId) return;
            
            const client = clients.get(clientId);
            if (!client || (!client.isAdmin && client.userRole !== 'ADMIN' && client.userRole !== 'MOD')) {
              ws.send(JSON.stringify({ type: "error", error: "Sem permissão" }));
              return;
            }

            const messageId = message.messageId;
            if (!messageId) {
              ws.send(JSON.stringify({ type: "error", error: "ID da mensagem não fornecido" }));
              return;
            }

            const deleted = await deleteMessage(messageId, clientId, "Removido por moderador");
            
            if (deleted && client.currentRoomId) {
              broadcastToRoom(client.currentRoomId, {
                type: "message_deleted",
                messageId
              });
              
              console.log(`[CHAT] Admin ${client.userName} deleted message ${messageId}`);
            }
            break;
          }

          // Admin action: Mute user
          case "admin_mute": {
            if (!clientId) return;
            
            const client = clients.get(clientId);
            if (!client || (!client.isAdmin && client.userRole !== 'ADMIN' && client.userRole !== 'MOD')) {
              ws.send(JSON.stringify({ type: "error", error: "Sem permissão" }));
              return;
            }

            const targetUserId = message.userId;
            const duration = message.duration || 5; // Default 5 minutes
            
            if (!targetUserId) {
              ws.send(JSON.stringify({ type: "error", error: "ID do usuário não fornecido" }));
              return;
            }

            const expiresAt = new Date(Date.now() + duration * 60 * 1000);
            
            await db.insert(chatPenalties).values({
              userId: targetUserId,
              roomId: client.currentRoomId,
              penaltyType: "MUTE",
              violationType: "MANUAL",
              reason: `Mutado por ${client.userName} por ${duration} minutos`,
              expiresAt,
              isActive: true,
              issuedBy: clientId,
            });

            // Notify the muted user
            const targetClient = clients.get(targetUserId);
            if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(JSON.stringify({
                type: "muted",
                duration,
                expiresAt: expiresAt.toISOString(),
                by: client.userName
              }));
            }

            ws.send(JSON.stringify({ 
              type: "admin_action_success", 
              action: "mute",
              targetUserId,
              duration
            }));
            
            console.log(`[CHAT] Admin ${client.userName} muted user ${targetUserId} for ${duration} minutes`);
            break;
          }

          // Admin action: Ban user
          case "admin_ban": {
            if (!clientId) return;
            
            const client = clients.get(clientId);
            if (!client || (!client.isAdmin && client.userRole !== 'ADMIN')) {
              ws.send(JSON.stringify({ type: "error", error: "Sem permissão" }));
              return;
            }

            const targetUserId = message.userId;
            
            if (!targetUserId) {
              ws.send(JSON.stringify({ type: "error", error: "ID do usuário não fornecido" }));
              return;
            }

            await db.insert(chatPenalties).values({
              userId: targetUserId,
              roomId: client.currentRoomId,
              penaltyType: "BAN",
              violationType: "MANUAL",
              reason: `Banido por ${client.userName}`,
              isActive: true,
              issuedBy: clientId,
            });

            // Disconnect the banned user
            const targetClient = clients.get(targetUserId);
            if (targetClient) {
              targetClient.ws.send(JSON.stringify({
                type: "banned",
                by: client.userName
              }));
              targetClient.ws.close();
            }

            ws.send(JSON.stringify({ 
              type: "admin_action_success", 
              action: "ban",
              targetUserId
            }));
            
            console.log(`[CHAT] Admin ${client.userName} banned user ${targetUserId}`);
            break;
          }

          case "admin_rain": {
            if (!clientId) return;
            
            const client = clients.get(clientId);
            if (!client || !client.isAdmin) {
              ws.send(JSON.stringify({ type: "error", error: "Sem permissão" }));
              return;
            }

            const totalAmount = Number(message.amount) || 100;
            const roomId = client.currentRoomId;
            
            if (!roomId) {
              ws.send(JSON.stringify({ type: "error", error: "Entre em uma sala primeiro" }));
              return;
            }

            if (totalAmount < 10 || totalAmount > 10000) {
              ws.send(JSON.stringify({ type: "error", error: "Valor deve ser entre R$10 e R$10.000" }));
              return;
            }

            const roomSubs = roomSubscriptions.get(roomId);
            const activeUserIds = Array.from(roomSubs || []).filter(id => id !== clientId);
            
            if (activeUserIds.length === 0) {
              ws.send(JSON.stringify({ type: "error", error: "Nenhum usuário ativo para receber" }));
              return;
            }

            const amountPerUser = Math.floor((totalAmount / activeUserIds.length) * 100) / 100;
            
            let successCount = 0;
            for (const recipientId of activeUserIds) {
              try {
                const referenceId = `rain_${clientId}_${recipientId}_${Date.now()}`;
                
                await db.transaction(async (tx) => {
                  const [wallet] = await tx
                    .select()
                    .from(wallets)
                    .where(eq(wallets.userId, recipientId))
                    .for("update");

                  if (!wallet) return;

                  const newBalance = parseFloat(wallet.balance) + amountPerUser;

                  await tx
                    .update(wallets)
                    .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
                    .where(eq(wallets.userId, recipientId));

                  await tx.insert(transactions).values({
                    walletId: wallet.id,
                    userId: recipientId,
                    type: TransactionType.BONUS,
                    amount: amountPerUser.toFixed(2),
                    status: TransactionStatus.COMPLETED,
                    description: `Chuva de R$${totalAmount} por ${client.userName}`,
                    referenceId,
                    metadata: JSON.stringify({ rainInitiator: clientId, rainAmount: totalAmount }),
                    balanceBefore: wallet.balance,
                    balanceAfter: newBalance.toFixed(2),
                  });
                });

                successCount++;

                const recipientClient = clients.get(recipientId);
                if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
                  recipientClient.ws.send(JSON.stringify({
                    type: "rain_received",
                    amount: amountPerUser,
                    from: client.userName
                  }));
                }
              } catch (err) {
                console.error(`[CHAT RAIN] Failed to credit ${recipientId}:`, err);
              }
            }

            broadcastToRoom(roomId, {
              type: "rain_event",
              amount: totalAmount,
              participants: successCount,
              initiator: client.userName,
              createdAt: new Date().toISOString()
            });

            console.log(`[CHAT] Admin ${client.userName} distributed R$${totalAmount} rain to ${successCount}/${activeUserIds.length} users`);
            break;
          }
        }
      } catch (error) {
        console.error("[CHAT WS] Error:", error);
        ws.send(JSON.stringify({ type: "error", error: "Erro interno" }));
      }
    });

    ws.on("close", async () => {
      console.log(`[CHAT WS][${connectionId}] Connection closed, clientId=${clientId || 'not_authenticated'}`);
      if (clientId) {
        const client = clients.get(clientId);
        if (client) {
          console.log(`[CHAT WS][${connectionId}] Cleaning up client: ${client.userName}, room=${client.currentRoomId}`);
          if (client.typingTimeout) {
            clearTimeout(client.typingTimeout);
          }
          
          if (client.currentRoomId) {
            const roomSubs = roomSubscriptions.get(client.currentRoomId);
            if (roomSubs) {
              roomSubs.delete(clientId);
            }
            broadcastToRoom(client.currentRoomId, {
              type: "user_left",
              userId: client.userId,
              userName: client.userName,
            });
            broadcastRoomOnlineCount(client.currentRoomId);
          }
        }
        
        await updateUserOnlineStatus(clientId, false);
        clients.delete(clientId);
        broadcastOnlineCount();
      }
    });

    ws.on("error", (error) => {
      console.error("[CHAT WS] Connection error:", error);
    });
  });

  console.log("[CHAT] WebSocket server initialized at /ws/chat");
}

function broadcastToRoom(roomId: string, data: object, excludeClientId?: string) {
  const roomSubs = roomSubscriptions.get(roomId);
  if (!roomSubs) return;

  const message = JSON.stringify(data);
  
  const subsArray = Array.from(roomSubs);
  for (let i = 0; i < subsArray.length; i++) {
    const clientId = subsArray[i];
    if (excludeClientId && clientId === excludeClientId) continue;
    
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

function broadcastOnlineCount() {
  const count = clients.size;
  const message = JSON.stringify({ type: "online_count", count });
  
  const clientsArray = Array.from(clients.values());
  for (let i = 0; i < clientsArray.length; i++) {
    const client = clientsArray[i];
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

function broadcastRoomOnlineCount(roomId: string) {
  const roomSubs = roomSubscriptions.get(roomId);
  const count = roomSubs?.size || 0;
  
  broadcastToRoom(roomId, {
    type: "room_online_count",
    roomId,
    count,
  });
}

function broadcastTypingStatus(roomId: string, clientId: string, isTyping: boolean, userName?: string) {
  broadcastToRoom(roomId, {
    type: "typing_status",
    userId: clientId,
    userName,
    isTyping,
  }, clientId);
}

export function broadcastSystemMessage(roomId: string, message: string) {
  broadcastToRoom(roomId, {
    type: "system_message",
    message,
    createdAt: new Date(),
  });
}

export function deleteMessageFromClients(roomId: string, messageId: string) {
  broadcastToRoom(roomId, {
    type: "message_deleted",
    messageId,
  });
}

export function getOnlineCount(): number {
  return clients.size;
}

export function getRoomOnlineCount(roomId: string): number {
  return roomSubscriptions.get(roomId)?.size || 0;
}

export async function broadcastCasinoWin(userId: string, userName: string, gameName: string, winAmount: number, userVipLevel?: string, userLevel?: number, multiplier?: number) {
  const messageText = `Ganhou R$ ${winAmount.toFixed(2)} no ${gameName}${multiplier ? ` (${multiplier.toFixed(2)}x)` : ""}`;
  
  try {
    const [savedMessage] = await db
      .insert(chatMessages)
      .values({
        roomId: "casino",
        userId,
        message: messageText,
      })
      .returning();

    const message: ChatMessageWithUser = {
      id: savedMessage.id,
      message: savedMessage.message,
      createdAt: savedMessage.createdAt,
      isDeleted: false,
      user: {
        id: userId,
        name: userName,
        vipLevel: userVipLevel || "bronze",
        level: userLevel || 1,
        role: "NONE",
        customization: null,
      },
    };

    broadcastToRoom("casino", {
      type: "new_message",
      roomId: "casino",
      message,
    });
  } catch (error) {
    console.error("[CASINO WIN] Error saving win message:", error);
  }
}
