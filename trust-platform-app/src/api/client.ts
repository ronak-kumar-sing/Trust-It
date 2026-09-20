import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';

/**
 * Creates a unique Idempotency-Key for financial state machine mutations.
 */
export function generateIdempotencyKey(prefix = 'idemp'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

class ApiClient {
  private instance: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: DEFAULT_API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.authToken && config.headers) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }

      // Automatically attach idempotency key for unsafe HTTP mutations if missing
      if (
        ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() ?? '') &&
        config.headers &&
        !config.headers['Idempotency-Key']
      ) {
        config.headers['Idempotency-Key'] = generateIdempotencyKey('req');
      }

      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        const message =
          error.response?.data?.message ??
          error.response?.data?.error ??
          error.message ??
          'Network connection error';
        return Promise.reject(new Error(message));
      }
    );
  }

  public setToken(token: string | null): void {
    this.authToken = token;
  }

  public get axios(): AxiosInstance {
    return this.instance;
  }
}

export const apiClient = new ApiClient();
