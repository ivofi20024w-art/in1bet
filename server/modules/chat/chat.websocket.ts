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
  getBlockedUsers 
} from "./chat.service";
import { db } from "../../db";
import { users, chatUserCustomization, chatUserBlocks } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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
  userVipLevel: string;
  userLevel: number;
  userRole: string;
  isAdmin: boolean;
  currentRoomId: string | null;
  customization: { nameColor?: string; nameEffect?: string; messageColor?: string } | null;
  blockedUsers: string[];
  isTyping: boolean;
  typingTimeout: NodeJS.Timeout | null;
}

const clients = new Map<string, ChatClient>();
const roomSubscriptions = new Map<string, Set<string>>();

export function setupChatWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server, 
    path: "/ws/chat" 
  });

  wss.on("connection", async (ws, req) => {
    let clientId: string | null = null;

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case "auth": {
            const token = message.token;
            const decoded = verifyAccessToken(token);
            
            if (!decoded) {
              ws.send(JSON.stringify({ type: "error", error: "Token inválido" }));
              ws.close();
              return;
            }

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
            clients.set(clientId, {
              ws,
              userId: user.id,
              userName: user.name,
              userVipLevel: user.vipLevel || "bronze",
              userLevel: user.level,
              userRole: user.chatModeratorRole || "NONE",
              isAdmin: user.isAdmin || false,
              currentRoomId: null,
              customization,
              blockedUsers,
              isTyping: false,
              typingTimeout: null,
            });

            await updateUserOnlineStatus(user.id, true);

            const rooms = await getChatRooms(user.vipLevel || "bronze");
            ws.send(JSON.stringify({ 
              type: "authenticated", 
              userId: user.id,
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
            if (!clientId) {
              ws.send(JSON.stringify({ type: "error", error: "Não autenticado" }));
              return;
            }

            const client = clients.get(clientId);
            if (!client) return;

            const roomId = message.roomId;
            
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
            if (!clientId) {
              ws.send(JSON.stringify({ type: "error", error: "Não autenticado" }));
              return;
            }

            const client = clients.get(clientId);
            if (!client || !client.currentRoomId) {
              ws.send(JSON.stringify({ type: "error", error: "Entre em uma sala primeiro" }));
              return;
            }

            if (client.isTyping) {
              client.isTyping = false;
              if (client.typingTimeout) {
                clearTimeout(client.typingTimeout);
                client.typingTimeout = null;
              }
              broadcastTypingStatus(client.currentRoomId, clientId, false);
            }

            const result = await sendMessage(
              client.userId,
              client.currentRoomId,
              message.message,
              client.userName,
              client.userVipLevel,
              client.userLevel,
              client.userRole,
              client.customization
            );

            if (!result.success) {
              ws.send(JSON.stringify({ 
                type: "message_error", 
                error: result.error,
                penalty: result.penalty 
              }));
              return;
            }

            if (result.message) {
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
            ws.send(JSON.stringify({ type: "pong" }));
            break;
          }
        }
      } catch (error) {
        console.error("[CHAT WS] Error:", error);
        ws.send(JSON.stringify({ type: "error", error: "Erro interno" }));
      }
    });

    ws.on("close", async () => {
      if (clientId) {
        const client = clients.get(clientId);
        if (client) {
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
