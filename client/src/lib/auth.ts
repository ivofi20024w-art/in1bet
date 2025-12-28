import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  birthDate: string | null;
  isVerified: boolean;
  kycStatus: string;
  vipLevel: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

const AUTH_STORAGE_KEY = "in1bet_auth";

// Get stored auth state
export function getStoredAuth(): AuthState {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading auth state:", e);
  }
  return { user: null, isAuthenticated: false, accessToken: null, refreshToken: null };
}

// Store auth state
export function storeAuth(state: AuthState): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error storing auth state:", e);
  }
}

// Clear auth state
export function clearAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Register new user
export async function register(data: {
  name: string;
  email: string;
  cpf: string;
  password: string;
  phone?: string;
  birthDate?: string;
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
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const auth = getStoredAuth();
  
  if (!auth.accessToken) {
    return null;
  }
  
  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        "Authorization": `Bearer ${auth.accessToken}`,
      },
    });
    
    if (!response.ok) {
      // Try to refresh token
      if (response.status === 401 && auth.refreshToken) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return getCurrentUser();
        }
      }
      clearAuth();
      return null;
    }
    
    const data = await response.json();
    return data.user;
  } catch (e) {
    console.error("Error getting current user:", e);
    return null;
  }
}

// Refresh access token
export async function refreshToken(): Promise<boolean> {
  const auth = getStoredAuth();
  
  if (!auth.refreshToken) {
    return false;
  }
  
  try {
    const response = await apiRequest("POST", "/api/auth/refresh", { refreshToken: auth.refreshToken });
    
    if (!response.ok) {
      clearAuth();
      return false;
    }
    
    const data = await response.json();
    
    storeAuth({
      ...auth,
      user: data.user,
      accessToken: data.accessToken,
    });
    
    return true;
  } catch (e) {
    console.error("Error refreshing token:", e);
    clearAuth();
    return false;
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
export async function getWallet(): Promise<{ balance: number; lockedBalance: number; currency: string } | null> {
  const auth = getStoredAuth();
  
  if (!auth.accessToken) {
    return null;
  }
  
  try {
    const response = await fetch("/api/wallet/balance", {
      headers: {
        "Authorization": `Bearer ${auth.accessToken}`,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (e) {
    console.error("Error getting wallet:", e);
    return null;
  }
}
