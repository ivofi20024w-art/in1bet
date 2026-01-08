import { z } from "zod";

const PLAYFIVERS_BASE_URL = "https://api.playfivers.com";

interface PlayfiversConfig {
  agentToken: string;
  secretKey: string;
  baseUrl?: string;
}

interface PlayfiversProvider {
  id: number;
  name: string;
  image_url: string;
  wallet: {
    name: string;
  };
  status: number;
}

interface PlayfiversGame {
  name: string;
  image_url: string;
  rounds_free: boolean;
  status: boolean;
  original: boolean;
  game_code: string;
  provider: {
    name: string;
  };
}

interface GameLaunchResponse {
  status: boolean;
  msg: string;
  launch_url: string;
  user_code: string;
  user_balance: number;
  user_created: boolean;
  name: string;
}

interface ProvidersResponse {
  status: number;
  data: PlayfiversProvider[];
  msg: string;
}

interface GamesResponse {
  status: number;
  data: PlayfiversGame[];
  msg: string;
}

interface BalancesResponse {
  status: number;
  data: Record<string, number>;
}

interface AgentInfoResponse {
  status: boolean;
  data: {
    rtp: number;
    limit_enable: number;
    limit_amount: number;
    limit_hours: number;
    bonus_enable: number;
  };
}

interface FreeRoundsResponse {
  status: boolean;
  msg: string;
}

export class PlayfiversApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody?: any
  ) {
    super(message);
    this.name = "PlayfiversApiError";
  }
}

export class PlayfiversClient {
  private config: PlayfiversConfig;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(config?: Partial<PlayfiversConfig>) {
    this.config = {
      agentToken: config?.agentToken || process.env.PLAYFIVER_TOKEN || "",
      secretKey: config?.secretKey || process.env.PLAYFIVER_SECRET || "",
      baseUrl: config?.baseUrl || PLAYFIVERS_BASE_URL,
    };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        if (response.status === 429) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.warn(`[PlayFivers] Rate limited, retrying in ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new PlayfiversApiError(
            data.msg || `HTTP ${response.status}`,
            response.status,
            data
          );
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof PlayfiversApiError && error.statusCode < 500) {
          throw error;
        }

        if (attempt < retries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.warn(`[PlayFivers] Request failed, retrying in ${delay}ms...`, error);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  isConfigured(): boolean {
    return !!(this.config.agentToken && this.config.secretKey);
  }

  async getProviders(): Promise<PlayfiversProvider[]> {
    const url = `${this.config.baseUrl}/api/v2/providers`;
    const response = await this.fetchWithRetry<ProvidersResponse>(url, {
      method: "GET",
    });
    return response.data || [];
  }

  async getGames(providerId?: number): Promise<PlayfiversGame[]> {
    let url = `${this.config.baseUrl}/api/v2/games`;
    if (providerId) {
      url += `?provider=${providerId}`;
    }
    const response = await this.fetchWithRetry<GamesResponse>(url, {
      method: "GET",
    });
    return response.data || [];
  }

  async launchGame(params: {
    userCode: string;
    gameCode: string;
    provider: string;
    gameOriginal: boolean;
    userBalance: number;
    userRtp?: number;
    lang?: string;
  }): Promise<GameLaunchResponse> {
    const url = `${this.config.baseUrl}/api/v2/game_launch`;
    
    const body = {
      agentToken: this.config.agentToken,
      secretKey: this.config.secretKey,
      user_code: params.userCode,
      game_code: params.gameCode,
      provider: params.provider,
      game_original: params.gameOriginal,
      user_balance: params.userBalance,
      user_rtp: params.userRtp,
      lang: params.lang || "pt",
    };

    return this.fetchWithRetry<GameLaunchResponse>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async grantFreeRounds(params: {
    userCode: string;
    gameCode: string;
    rounds: number;
  }): Promise<FreeRoundsResponse> {
    const url = `${this.config.baseUrl}/api/v2/free_bonus`;

    const body = {
      agent_token: this.config.agentToken,
      secret_key: this.config.secretKey,
      user_code: params.userCode,
      game_code: params.gameCode,
      rounds: params.rounds,
    };

    return this.fetchWithRetry<FreeRoundsResponse>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getBalances(): Promise<Record<string, number>> {
    const url = `${this.config.baseUrl}/api/v2/balances?agentToken=${encodeURIComponent(this.config.agentToken)}&secretKey=${encodeURIComponent(this.config.secretKey)}`;
    const response = await this.fetchWithRetry<BalancesResponse>(url, {
      method: "GET",
    });
    return response.data || {};
  }

  async getAgentInfo(): Promise<AgentInfoResponse["data"]> {
    const url = `${this.config.baseUrl}/api/v2/agent?agentToken=${encodeURIComponent(this.config.agentToken)}&secretKey=${encodeURIComponent(this.config.secretKey)}`;
    const response = await this.fetchWithRetry<AgentInfoResponse>(url, {
      method: "GET",
    });
    return response.data;
  }

  async updateAgentSettings(params: {
    rtp?: number;
    limitEnable?: boolean;
    limitAmount?: number;
    limitHours?: number;
    bonusEnable?: boolean;
  }): Promise<{ status: boolean; msg: string }> {
    const url = `${this.config.baseUrl}/api/v2/agent`;

    const body: Record<string, any> = {
      agentToken: this.config.agentToken,
      secretKey: this.config.secretKey,
    };

    if (params.rtp !== undefined) body.rtp = params.rtp;
    if (params.limitEnable !== undefined) body.limit_enable = params.limitEnable;
    if (params.limitAmount !== undefined) body.limite_amount = params.limitAmount;
    if (params.limitHours !== undefined) body.limit_hours = params.limitHours;
    if (params.bonusEnable !== undefined) body.bonus_enable = params.bonusEnable;

    return this.fetchWithRetry(url, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
}

export const playfiversClient = new PlayfiversClient();
