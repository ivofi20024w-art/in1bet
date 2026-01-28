import { create } from 'zustand';
import { getStoredAuthState, refreshAccessToken } from '@/lib/authTokens';

export interface ChatRoom {
  id: string;
  name: string;
  displayName: string;
  type: string;
  gameType?: string | null;
  minVipLevel?: string | null;
}

export interface ChatUserCustomization {
  nameColor?: string;
  nameEffect?: string;
  messageColor?: string;
}

export interface ChatUser {
  id: string;
  username?: string;
  name: string;
  vipLevel: string;
  level: number;
  role?: string;
  avatarUrl?: string | null;
  customization?: ChatUserCustomization | null;
}

export interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  isDeleted?: boolean;
  user: ChatUser;
  replyTo?: {
    id: string;
    username: string;
    content: string;
  };
}

export interface TypingUser {
  userId: string;
  userName: string;
}

interface ChatState {
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  pendingRoomId: string | null;
  rooms: ChatRoom[];
  currentRoomId: string | null;
  messages: Map<string, ChatMessage[]>;
  onlineCount: number;
  roomOnlineCounts: Map<string, number>;
  typingUsers: Map<string, TypingUser[]>;
  blockedUsers: string[];
  myUserId: string | null;
  myUserName: string | null;
  myRole: string;
  myLevel: number;
  myVipLevel: string;
  myCustomization: ChatUserCustomization | null;
  isAdmin: boolean;
  showStaffBadge: boolean;
  lastError: string | null;
  
  setShowStaffBadge: (show: boolean) => void;
  connect: () => void;
  disconnect: () => void;
  logout: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (message: string, replyTo?: { id: string; username: string; content: string }) => void;
  sendTyping: () => void;
  stopTyping: () => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  adminDeleteMessage: (messageId: string) => void;
  adminMuteUser: (userId: string, duration: number) => void;
  adminBanUser: (userId: string, reason: string) => void;
  clearMessages: (roomId: string) => void;
  getMessagesForRoom: (roomId: string) => ChatMessage[];
  getRoomOnlineCount: (roomId: string) => number;
  reportMessage: (messageId: string, reason: string) => void;
}

let wsInstance: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let pingInterval: NodeJS.Timeout | null = null;
let connectLock = false;
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 25000;

export const useChatStore = create<ChatState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  isAuthenticated: false,
  pendingRoomId: null,
  rooms: [],
  currentRoomId: null,
  messages: new Map(),
  onlineCount: 0,
  roomOnlineCounts: new Map(),
  typingUsers: new Map(),
  blockedUsers: [],
  myUserId: null,
  myUserName: null,
  showStaffBadge: false,
  myRole: 'NONE',
  myLevel: 1,
  myVipLevel: 'bronze',
  myCustomization: null,
  isAdmin: false,
  lastError: null,

  connect: () => {
    const state = get();
    console.log('[ChatStore] connect called:', {
      connectLock,
      isConnected: state.isConnected,
      isConnecting: state.isConnecting,
      wsReadyState: wsInstance?.readyState
    });
    
    if (connectLock || state.isConnected || state.isConnecting || wsInstance?.readyState === WebSocket.OPEN) {
      console.log('[ChatStore] connect ABORTED - already connecting or connected');
      return;
    }

    const auth = getStoredAuthState();
    if (!auth.isAuthenticated) {
      console.log('[ChatStore] connect ABORTED - not authenticated');
      return;
    }

    connectLock = true;
    set({ isConnecting: true, lastError: null });

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    console.log('[ChatStore] Creating WebSocket connection to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsInstance = ws;

    ws.onopen = () => {
      console.log('[ChatStore] WebSocket OPEN, sending auth (cookie-based)...');
      ws.send(JSON.stringify({ type: 'auth' }));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[ChatStore] Message received:', data.type, data.type === 'new_message' ? `from ${data.message?.user?.name}` : '');
        handleMessage(data, set, get);
      } catch (err) {
        console.error('[ChatStore] Error parsing message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('[ChatStore] WebSocket CLOSED:', event.code, event.reason);
      const state = get();
      const previousRoomId = state.currentRoomId;
      wsInstance = null;
      connectLock = false;
      set({ 
        isConnected: false, 
        isConnecting: false, 
        isAuthenticated: false,
        currentRoomId: null,
        pendingRoomId: previousRoomId
      });

      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      const auth = getStoredAuthState();
      if (auth.isAuthenticated && event.code !== 1000) {
        console.log('[ChatStore] Will reconnect in', RECONNECT_DELAY, 'ms');
        reconnectTimeout = setTimeout(() => {
          console.log('[ChatStore] Attempting reconnect...');
          get().connect();
        }, RECONNECT_DELAY);
      } else {
        console.log('[ChatStore] Not reconnecting - code=1000 or not authenticated');
      }
    };

    ws.onerror = (error) => {
      console.error('[ChatStore] WebSocket ERROR:', error);
      console.log('[ChatStore] Error details - readyState:', ws.readyState);
      connectLock = false;
      set({ isConnecting: false, lastError: 'Erro de conexão com o chat' });
    };
  },

  disconnect: () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    if (wsInstance) {
      wsInstance.close(1000, 'Disconnecting');
      wsInstance = null;
    }
    connectLock = false;
    set({
      isConnected: false,
      isConnecting: false,
      isAuthenticated: false,
      currentRoomId: null,
      pendingRoomId: null,
    });
  },
  
  logout: () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    if (wsInstance) {
      wsInstance.close(1000, 'User logout');
      wsInstance = null;
    }
    connectLock = false;
    set({
      isConnected: false,
      isConnecting: false,
      isAuthenticated: false,
      currentRoomId: null,
      pendingRoomId: null,
      myUserId: null,
      myUserName: null,
      rooms: [],
      messages: new Map(),
      onlineCount: 0,
      roomOnlineCounts: new Map(),
      typingUsers: new Map(),
    });
  },

  joinRoom: (roomId: string) => {
    const state = get();
    console.log('[ChatStore] joinRoom called:', {
      roomId,
      wsExists: !!wsInstance,
      wsReadyState: wsInstance?.readyState,
      isConnected: state.isConnected,
      isAuthenticated: state.isAuthenticated,
      currentRoomId: state.currentRoomId
    });
    
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
      console.log('[ChatStore] joinRoom ABORTED - WebSocket not open');
      set({ pendingRoomId: roomId });
      return;
    }
    
    if (!state.isAuthenticated) {
      console.log('[ChatStore] joinRoom QUEUED - waiting for authentication');
      set({ pendingRoomId: roomId });
      return;
    }
    
    if (state.currentRoomId === roomId) {
      console.log('[ChatStore] joinRoom SKIPPED - already in room');
      return;
    }
    
    console.log('[ChatStore] joinRoom - sending request...');
    wsInstance.send(JSON.stringify({ type: 'join_room', roomId }));
  },

  leaveRoom: () => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
    wsInstance.send(JSON.stringify({ type: 'leave_room' }));
    set({ currentRoomId: null });
  },

  sendMessage: (message: string, replyTo?: { id: string; username: string; content: string }) => {
    const state = get();
    console.log('[ChatStore] sendMessage called:', {
      message: message.slice(0, 50),
      wsExists: !!wsInstance,
      wsReadyState: wsInstance?.readyState,
      isConnected: state.isConnected,
      currentRoomId: state.currentRoomId
    });
    
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
      console.log('[ChatStore] sendMessage ABORTED - WebSocket not open');
      return;
    }
    if (!message.trim()) {
      console.log('[ChatStore] sendMessage ABORTED - empty message');
      return;
    }
    
    console.log('[ChatStore] sendMessage - sending to server...');
    wsInstance.send(JSON.stringify({ 
      type: 'send_message', 
      message: message.trim(),
      replyTo 
    }));
    console.log('[ChatStore] sendMessage - sent successfully');
  },

  sendTyping: () => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
    wsInstance.send(JSON.stringify({ type: 'typing' }));
  },

  stopTyping: () => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
    wsInstance.send(JSON.stringify({ type: 'stop_typing' }));
  },

  blockUser: (userId: string) => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
    wsInstance.send(JSON.stringify({ type: 'block_user', userId }));
  },

  unblockUser: (userId: string) => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
    wsInstance.send(JSON.stringify({ type: 'unblock_user', userId }));
  },

  adminDeleteMessage: (messageId: string) => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
    wsInstance.send(JSON.stringify({ type: 'admin_delete_message', messageId }));
  },

  adminMuteUser: (userId: string, duration: number) => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
    wsInstance.send(JSON.stringify({ type: 'admin_mute', userId, duration }));
  },

  adminBanUser: (userId: string, reason: string) => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
    wsInstance.send(JSON.stringify({ type: 'admin_ban', userId, reason }));
  },

  clearMessages: (roomId: string) => {
    const messages = new Map(get().messages);
    messages.delete(roomId);
    set({ messages });
  },

  getMessagesForRoom: (roomId: string) => {
    return get().messages.get(roomId) || [];
  },
  
  getRoomOnlineCount: (roomId: string) => {
    return get().roomOnlineCounts.get(roomId) || 0;
  },
  
  reportMessage: (messageId: string, reason: string) => {
    console.log('[ChatStore] Report message:', messageId, reason);
  },

  setShowStaffBadge: (show: boolean) => {
    set({ showStaffBadge: show });
  },
}));

async function handleMessage(
  data: any,
  set: (partial: Partial<ChatState>) => void,
  get: () => ChatState
) {
  switch (data.type) {
    case 'authenticated': {
      console.log('[ChatStore] Authenticated successfully');
      const state = get();
      const roomToJoin = state.pendingRoomId || 'global';
      
      set({
        isConnected: true,
        isConnecting: false,
        isAuthenticated: true,
        pendingRoomId: null,
        rooms: data.rooms || [],
        myUserId: data.userId,
        myUserName: data.userName,
        myRole: data.userRole || 'NONE',
        myLevel: data.level || 1,
        myVipLevel: data.vipLevel || 'bronze',
        myCustomization: data.customization || null,
        isAdmin: data.isAdmin || false,
        blockedUsers: [],
      });

      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (wsInstance?.readyState === WebSocket.OPEN) {
          wsInstance.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL);

      console.log('[ChatStore] Auto-joining room after auth:', roomToJoin);
      if (wsInstance?.readyState === WebSocket.OPEN) {
        wsInstance.send(JSON.stringify({ type: 'join_room', roomId: roomToJoin }));
      }
      break;
    }

    case 'auth_failed': {
      console.log('[ChatStore] Auth failed, trying token refresh...');
      set({ isAuthenticated: false, isConnecting: false });
      
      try {
        const newToken = await refreshAccessToken();
        if (newToken && wsInstance?.readyState === WebSocket.OPEN) {
          wsInstance.send(JSON.stringify({ type: 'auth', token: newToken }));
        } else {
          connectLock = false;
          if (wsInstance) {
            wsInstance.close(1000, 'Auth refresh failed');
          }
        }
      } catch (err) {
        console.error('[ChatStore] Token refresh failed:', err);
        connectLock = false;
        set({ lastError: 'Sessão expirada. Faça login novamente.' });
        if (wsInstance) {
          wsInstance.close(1000, 'Auth refresh failed');
        }
      }
      break;
    }

    case 'room_joined': {
      const roomId = data.roomId;
      const messages = new Map(get().messages);
      messages.set(roomId, data.messages || []);
      
      const roomOnlineCounts = new Map(get().roomOnlineCounts);
      roomOnlineCounts.set(roomId, data.onlineCount || 0);
      
      set({ 
        currentRoomId: roomId, 
        messages,
        roomOnlineCounts,
      });
      break;
    }

    case 'join_room_error': {
      set({ lastError: data.error });
      break;
    }

    case 'new_message': {
      const state = get();
      const roomId = data.roomId || data.message?.roomId || state.currentRoomId;
      if (!roomId) return;

      const messages = new Map(state.messages);
      const roomMessages = [...(messages.get(roomId) || [])];
      
      if (!roomMessages.find(m => m.id === data.message.id)) {
        roomMessages.push(data.message);
        if (roomMessages.length > 200) {
          roomMessages.shift();
        }
        messages.set(roomId, roomMessages);
        set({ messages });
      }
      break;
    }

    case 'message_deleted': {
      const state = get();
      const roomId = data.roomId || state.currentRoomId;
      if (!roomId) return;

      const messages = new Map(state.messages);
      const roomMessages = (messages.get(roomId) || []).filter(m => m.id !== data.messageId);
      messages.set(roomId, roomMessages);
      set({ messages });
      break;
    }

    case 'message_error': {
      set({ lastError: data.error });
      break;
    }

    case 'online_count': {
      set({ onlineCount: data.count || 0 });
      break;
    }

    case 'room_online_count': {
      const roomOnlineCounts = new Map(get().roomOnlineCounts);
      roomOnlineCounts.set(data.roomId, data.count || 0);
      set({ roomOnlineCounts });
      break;
    }

    case 'user_typing': {
      const state = get();
      const roomId = data.roomId || state.currentRoomId;
      if (!roomId) return;

      const typingUsers = new Map(state.typingUsers);
      const roomTyping = [...(typingUsers.get(roomId) || [])];
      
      if (!roomTyping.find(u => u.userId === data.userId)) {
        roomTyping.push({ userId: data.userId, userName: data.userName });
        typingUsers.set(roomId, roomTyping);
        set({ typingUsers });
      }
      break;
    }

    case 'user_stopped_typing': {
      const state = get();
      const roomId = data.roomId || state.currentRoomId;
      if (!roomId) return;

      const typingUsers = new Map(state.typingUsers);
      const roomTyping = (typingUsers.get(roomId) || []).filter(u => u.userId !== data.userId);
      typingUsers.set(roomId, roomTyping);
      set({ typingUsers });
      break;
    }

    case 'user_blocked': {
      const blockedUsers = [...get().blockedUsers, data.userId];
      set({ blockedUsers });
      break;
    }

    case 'user_unblocked': {
      const blockedUsers = get().blockedUsers.filter(id => id !== data.userId);
      set({ blockedUsers });
      break;
    }

    case 'muted': {
      set({ lastError: `Você foi silenciado por ${data.duration} minutos` });
      break;
    }

    case 'banned': {
      set({ lastError: 'Você foi banido do chat' });
      break;
    }

    case 'pong':
    case 'ping': {
      if (data.type === 'ping' && wsInstance?.readyState === WebSocket.OPEN) {
        wsInstance.send(JSON.stringify({ type: 'pong' }));
      }
      break;
    }

    case 'admin_action_success': {
      break;
    }

    case 'error': {
      set({ lastError: data.error });
      break;
    }
  }
}

export function initializeChatOnAuth() {
  const auth = getStoredAuthState();
  if (auth.isAuthenticated) {
    useChatStore.getState().connect();
  }
}

export function cleanupChatOnLogout() {
  useChatStore.getState().logout();
}
