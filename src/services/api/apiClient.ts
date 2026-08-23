import { secureStorage } from '../storage/secureStorage';
import { logger } from '../../utils/logger';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080/api/v1';
const DATA_SOURCE = process.env.EXPO_PUBLIC_DATA_SOURCE || 'mock';

export const isMockMode = DATA_SOURCE === 'mock';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await secureStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const headers = await this.getHeaders();
    let url = `${this.baseUrl}${endpoint}`;

    if (options.params) {
      const queryString = new URLSearchParams(
        Object.entries(options.params).map(([k, v]) => [k, String(v)])
      ).toString();
      url = `${url}?${queryString}`;
    }

    logger.info(`HTTP Request -> ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`HTTP Error ${response.status} from ${url}:`, errorBody);
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  get<T>(endpoint: string, params?: Record<string, any>) {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
