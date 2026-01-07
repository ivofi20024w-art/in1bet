import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { 
  sendMessage, 
  updateUserOnlineStatus, 
  getRoomMessages, 
  getChatRooms,
  ChatMessageWithUser 
} from "./chat.service";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

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
  currentRoomId: string | null;
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

            clientId = user.id;
            clients.set(clientId, {
              ws,
              userId: user.id,
              userName: user.name,
              userVipLevel: user.vipLevel || "bronze",
              userLevel: user.level,
              currentRoomId: null,
            });

            await updateUserOnlineStatus(user.id, true);

            const rooms = await getChatRooms(user.vipLevel || "bronze");
            ws.send(JSON.stringify({ 
              type: "authenticated", 
              userId: user.id,
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
              }
            }

            client.currentRoomId = roomId;
            
            if (!roomSubscriptions.has(roomId)) {
              roomSubscriptions.set(roomId, new Set());
            }
            roomSubscriptions.get(roomId)!.add(clientId);

            await updateUserOnlineStatus(clientId, true, roomId);

            const messages = await getRoomMessages(roomId, 100);
            ws.send(JSON.stringify({ 
              type: "room_joined", 
              roomId,
              messages 
            }));

            broadcastToRoom(roomId, {
              type: "user_joined",
              userId: client.userId,
              userName: client.userName,
              vipLevel: client.userVipLevel,
            }, clientId);
            
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

            const result = await sendMessage(
              client.userId,
              client.currentRoomId,
              message.message,
              client.userName,
              client.userVipLevel,
              client.userLevel
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
        if (client && client.currentRoomId) {
          const roomSubs = roomSubscriptions.get(client.currentRoomId);
          if (roomSubs) {
            roomSubs.delete(clientId);
          }
          broadcastToRoom(client.currentRoomId, {
            type: "user_left",
            userId: client.userId,
            userName: client.userName,
          });
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
