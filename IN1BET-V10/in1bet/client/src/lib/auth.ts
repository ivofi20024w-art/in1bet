import { apiRequest } from "./queryClient";
import { httpGet } from "./httpClient";
import { 
  getStoredAuthState, 
  storeAuthState, 
  clearAuthState, 
  refreshAccessToken,
  dispatchAuthChange,
  type AuthState 
} from "./authTokens";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  birthDate: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  adminRole?: string;
  kycStatus: string;
  vipLevel: string;
  level?: number;
  xp?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export { type AuthState } from "./authTokens";

export const getStoredAuth = getStoredAuthState;
export const storeAuth = storeAuthState;
export const clearAuth = clearAuthState;
export const refreshToken = refreshAccessToken;

// Register new user
export async function register(data: {
  username: string;
  name: string;
  email: string;
  cpf: string;
  password: string;
  phone?: string;
  birthDate?: string;
  referralCode?: string;
}): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const response = await apiRequest("POST", "/api/auth/register", data);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Erro ao criar conta");
  }
  
  const authState: AuthState = {
    user: result.user,
    isAuthenticated: true,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  };
  storeAuth(authState);
  dispatchAuthChange();
  
  return result;
}

// Login with email or CPF
export async function login(identifier: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const response = await apiRequest("POST", "/api/auth/login", { identifier, password });
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Erro ao fazer login");
  }
  
  const authState: AuthState = {
    user: result.user,
    isAuthenticated: true,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  };
  storeAuth(authState);
  dispatchAuthChange();
  
  return result;
}

// Logout
export async function logout(): Promise<void> {
  const auth = getStoredAuth();
  
  try {
    if (auth.refreshToken) {
      await apiRequest("POST", "/api/auth/logout", { refreshToken: auth.refreshToken });
    }
  } catch (e) {
    console.error("Error during logout:", e);
  }
  
  clearAuth();
  dispatchAuthChange();
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const auth = getStoredAuth();
  
  if (!auth.accessToken) {
    return null;
  }
  
  try {
    const { data, error } = await httpGet<{ user: User }>("/api/auth/me");
    
    if (error || !data?.user) {
      return null;
    }
    
    return data.user;
  } catch (e) {
    console.error("[AUTH] Error getting current user:", e);
    return null;
  }
}

// Get auth header for API requests
export function getAuthHeader(): Record<string, string> {
  const auth = getStoredAuth();
  
  if (auth.accessToken) {
    return { "Authorization": `Bearer ${auth.accessToken}` };
  }
  
  return {};
}

// Get wallet balance
export async function getWallet(): Promise<{ 
  balance: number; 
  lockedBalance: number; 
  bonusBalance: number;
  rolloverRemaining: number;
  rolloverTotal: number;
  rolloverProgress: number;
  currency: string;
} | null> {
  const auth = getStoredAuth();
  
  if (!auth.accessToken) {
    return null;
  }
  
  try {
    const { data, error } = await httpGet<{ wallet: any }>("/api/wallet");
    
    if (error || !data?.wallet) {
      return null;
    }
    
    return {
      balance: data.wallet.balance || 0,
      lockedBalance: data.wallet.lockedBalance || 0,
      bonusBalance: data.wallet.bonusBalance || 0,
      rolloverRemaining: data.wallet.rolloverRemaining || 0,
      rolloverTotal: data.wallet.rolloverTotal || 0,
      rolloverProgress: data.wallet.rolloverProgress || 100,
      currency: data.wallet.currency || "BRL",
    };
  } catch (e) {
    console.error("Error getting wallet:", e);
    return null;
  }
}
