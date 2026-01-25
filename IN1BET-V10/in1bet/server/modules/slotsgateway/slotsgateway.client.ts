import { z } from "zod";

interface SlotsGatewayConfig {
  apiLogin: string;
  apiPassword: string;
  baseUrl: string;
}

interface SlotsGatewayGame {
  id: number;
  name: string;
  type: string;
  category: string;
  subcategory: string;
  details: any[];
  new: boolean;
  mobile: boolean;
  id_hash: string;
  id_hash_parent: string;
  freerounds_supported: boolean;
  featurebuy_supported: boolean;
  has_jackpot: boolean;
  play_for_fun_supported: boolean;
  image: string;
  image_square: string;
  image_portrait: string;
  image_long: string;
  currency: string;
}

interface CreatePlayerResponse {
  error: number;
  response?: {
    id: number;
    username: string;
    balance: string;
    currencycode: string;
    created: string;
    agent_balance: string | null;
  };
  message?: string;
}

interface GetGameResponse {
  error: number;
  response?: string;
  session_id?: string;
  message?: string;
}

interface GetGameListResponse {
  error: number;
  response?: SlotsGatewayGame[];
  message?: string;
}

interface GetGameDemoResponse {
  error: number;
  response?: string;
  message?: string;
}

export class SlotsGatewayApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: number,
    public responseBody?: any
  ) {
    super(message);
    this.name = "SlotsGatewayApiError";
  }
}

export class SlotsGatewayClient {
  private config: SlotsGatewayConfig;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(config?: Partial<SlotsGatewayConfig>) {
    this.config = {
      apiLogin: config?.apiLogin || process.env.SLOTSGATEWAY_API_LOGIN || "",
      apiPassword: config?.apiPassword || process.env.SLOTSGATEWAY_API_PASSWORD || "",
      baseUrl: config?.baseUrl || process.env.SLOTSGATEWAY_BASE_URL || "",
    };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchWithRetry<T>(
    options: RequestInit,
    retries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(this.config.baseUrl, {
          ...options,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        if (response.status === 429) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.warn(`[SlotsGateway] Rate limited, retrying in ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new SlotsGatewayApiError(
            data.message || `HTTP ${response.status}`,
            response.status,
            data.error,
            data
          );
        }

        if (data.error && data.error !== 0) {
          throw new SlotsGatewayApiError(
            data.message || `API Error ${data.error}`,
            200,
            data.error,
            data
          );
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof SlotsGatewayApiError && error.statusCode < 500 && error.statusCode !== 429) {
          throw error;
        }

        if (attempt < retries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.warn(`[SlotsGateway] Request failed, retrying in ${delay}ms...`, error);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  isConfigured(): boolean {
    return !!(this.config.apiLogin && this.config.apiPassword && this.config.baseUrl);
  }

  async createPlayer(
    username: string,
    password: string,
    currency: string = "BRL"
  ): Promise<CreatePlayerResponse> {
    console.log(`[SlotsGateway] Creating player: ${username}`);
    
    const body = {
      api_login: this.config.apiLogin,
      api_password: this.config.apiPassword,
      method: "createPlayer",
      user_username: username,
      user_password: password,
      currency: currency,
    };

    const response = await this.fetchWithRetry<CreatePlayerResponse>({
      body: JSON.stringify(body),
    });

    console.log(`[SlotsGateway] Player created/exists: ${username}`);
    return response;
  }

  async getGame(
    username: string,
    password: string,
    gameId: string,
    currency: string = "BRL",
    lang: string = "pt",
    homeUrl?: string,
    cashierUrl?: string
  ): Promise<GetGameResponse> {
    console.log(`[SlotsGateway] Launching game: ${gameId} for user: ${username}`);
    
    const body: Record<string, any> = {
      api_login: this.config.apiLogin,
      api_password: this.config.apiPassword,
      method: "getGame",
      lang: lang,
      user_username: username,
      user_password: password,
      gameid: gameId,
      play_for_fun: 0,
      currency: currency,
    };

    if (homeUrl) body.homeurl = homeUrl;
    if (cashierUrl) body.cashierurl = cashierUrl;

    const response = await this.fetchWithRetry<GetGameResponse>({
      body: JSON.stringify(body),
    });

    console.log(`[SlotsGateway] Game launched, session: ${response.session_id}`);
    return response;
  }

  async getGameDemo(
    gameId: string,
    lang: string = "pt",
    homeUrl?: string
  ): Promise<GetGameDemoResponse> {
    console.log(`[SlotsGateway] Launching demo game: ${gameId}`);
    
    const body: Record<string, any> = {
      api_login: this.config.apiLogin,
      api_password: this.config.apiPassword,
      method: "getGameDemo",
      lang: lang,
      gameid: gameId,
    };

    if (homeUrl) body.homeurl = homeUrl;

    const response = await this.fetchWithRetry<GetGameDemoResponse>({
      body: JSON.stringify(body),
    });

    console.log(`[SlotsGateway] Demo game launched`);
    return response;
  }

  async getGameList(currency: string = "BRL", showAdditional: number = 0): Promise<SlotsGatewayGame[]> {
    console.log(`[SlotsGateway] Fetching game list for currency: ${currency}`);
    
    const body = {
      api_login: this.config.apiLogin,
      api_password: this.config.apiPassword,
      method: "getGameList",
      show_additional: showAdditional,
      show_systems: 0,
      currency: currency,
    };

    const response = await this.fetchWithRetry<GetGameListResponse>({
      body: JSON.stringify(body),
    });

    const games = response.response || [];
    console.log(`[SlotsGateway] Fetched ${games.length} games`);
    return games;
  }

  async addFreeRounds(
    username: string,
    gameId: string,
    rounds: number,
    currency: string = "BRL"
  ): Promise<{ error: number; message?: string }> {
    console.log(`[SlotsGateway] Adding ${rounds} free rounds for ${username} on game ${gameId}`);
    
    const body = {
      api_login: this.config.apiLogin,
      api_password: this.config.apiPassword,
      method: "addFreeRounds",
      user_username: username,
      gameid: gameId,
      freespins_count: rounds,
      currency: currency,
    };

    const response = await this.fetchWithRetry<{ error: number; message?: string }>({
      body: JSON.stringify(body),
    });

    console.log(`[SlotsGateway] Free rounds added`);
    return response;
  }
}

export type { SlotsGatewayGame, CreatePlayerResponse, GetGameResponse, GetGameListResponse };
