import { getStoredAuthState, clearAuthState, refreshAccessToken } from "./authTokens";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let sessionExpiredToastShown = false;

export interface HttpClientOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

async function waitForRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }
  return false;
}

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return waitForRefresh();
  }

  isRefreshing = true;
  refreshPromise = refreshAccessToken();

  try {
    const success = await refreshPromise;
    return success;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

function showSessionExpiredOnce() {
  if (sessionExpiredToastShown) return;
  sessionExpiredToastShown = true;

  const event = new CustomEvent("session-expired");
  window.dispatchEvent(event);

  setTimeout(() => {
    sessionExpiredToastShown = false;
  }, 5000);
}

function performLogout(hadSession: boolean = false) {
  clearAuthState();
  
  // Only show "session expired" toast and redirect if user actually had a session
  if (hadSession) {
    showSessionExpiredOnce();
    
    if (window.location.pathname !== "/" && !window.location.pathname.startsWith("/auth")) {
      window.location.href = "/";
    }
  }
}

export async function httpClient<T = any>(
  url: string,
  options: HttpClientOptions = {}
): Promise<{ data: T | null; response: Response; error?: string }> {
  const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options;

  const auth = getStoredAuthState();
  
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (!skipAuth && auth.accessToken) {
    headers["Authorization"] = `Bearer ${auth.accessToken}`;
  }

  if (fetchOptions.body && typeof fetchOptions.body === "string") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  try {
    let response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include",
    });

    if (response.status === 401 && !skipAuth && !skipRefresh && auth.refreshToken) {
      console.log("[httpClient] Got 401, attempting token refresh...");
      
      const refreshed = await attemptRefresh();
      
      if (refreshed) {
        console.log("[httpClient] Token refreshed successfully, retrying request...");
        const newAuth = getStoredAuthState();
        
        if (newAuth.accessToken) {
          headers["Authorization"] = `Bearer ${newAuth.accessToken}`;
          
          response = await fetch(url, {
            ...fetchOptions,
            headers,
            credentials: "include",
          });
        }
      } else {
        console.log("[httpClient] Token refresh failed, logging out...");
        performLogout(true); // Had session - refresh failed
        return {
          data: null,
          response,
          error: "Sessão expirada. Faça login novamente.",
        };
      }
    }

    if (response.status === 401) {
      // Check current auth state at time of 401 (not stale initial auth)
      const currentAuth = getStoredAuthState();
      const hadSession = !!(currentAuth.accessToken || currentAuth.refreshToken);
      
      // Only perform logout actions if user actually had a session
      if (hadSession) {
        performLogout(true);
        return {
          data: null,
          response,
          error: "Sessão expirada. Faça login novamente.",
        };
      }
      
      // For guests hitting auth-required endpoints, just return silently
      return {
        data: null,
        response,
      };
    }

    if (!response.ok) {
      let errorMessage = "Erro na requisição";
      try {
        const errorData = await response.clone().json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        data: null,
        response,
        error: errorMessage,
      };
    }

    let data: T | null = null;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    return { data, response };
  } catch (error) {
    console.error("[httpClient] Network error:", error);
    return {
      data: null,
      response: new Response(null, { status: 0 }),
      error: "Erro de conexão. Verifique sua internet.",
    };
  }
}

export async function httpGet<T = any>(
  url: string,
  options: HttpClientOptions = {}
): Promise<{ data: T | null; response: Response; error?: string }> {
  return httpClient<T>(url, { ...options, method: "GET" });
}

export async function httpPost<T = any>(
  url: string,
  body?: any,
  options: HttpClientOptions = {}
): Promise<{ data: T | null; response: Response; error?: string }> {
  return httpClient<T>(url, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function httpPut<T = any>(
  url: string,
  body?: any,
  options: HttpClientOptions = {}
): Promise<{ data: T | null; response: Response; error?: string }> {
  return httpClient<T>(url, {
    ...options,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function httpDelete<T = any>(
  url: string,
  options: HttpClientOptions = {}
): Promise<{ data: T | null; response: Response; error?: string }> {
  return httpClient<T>(url, { ...options, method: "DELETE" });
}

export function getAuthHeaders(): Record<string, string> {
  const auth = getStoredAuthState();
  if (auth.accessToken) {
    return { Authorization: `Bearer ${auth.accessToken}` };
  }
  return {};
}
