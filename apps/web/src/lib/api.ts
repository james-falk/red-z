import axios, { AxiosInstance } from 'axios';

/**
 * API Client for Express Backend
 * 
 * SECURITY:
 * - Gets JWT token from /api/session endpoint
 * - Includes Authorization: Bearer <token> header
 * - Token is validated by Express middleware
 * - Token expires after 7 days (refreshed on each request)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private client: AxiosInstance;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
    });
  }

  /**
   * Get authentication headers with JWT token
   * 
   * SECURITY:
   * - Fetches JWT from Next.js session API
   * - Caches token to avoid repeated calls (5 min cache)
   * - Token validated by Express using same JWT_SECRET
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    // Check cache first (5 minute cache)
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return { Authorization: `Bearer ${this.tokenCache.token}` };
    }

    try {
      const response = await fetch('/api/session');
      
      if (!response.ok) {
        return {}; // Not authenticated
      }

      const data = await response.json();
      
      if (data.accessToken) {
        // Cache token for 5 minutes
        this.tokenCache = {
          token: data.accessToken,
          expiresAt: Date.now() + 5 * 60 * 1000,
        };
        return { Authorization: `Bearer ${data.accessToken}` };
      }
    } catch (error) {
      console.error('Failed to get auth headers:', error);
    }

    return {};
  }

  /**
   * Clear token cache (call after sign out)
   */
  clearTokenCache(): void {
    this.tokenCache = null;
  }

  async get(url: string, config = {}) {
    const headers = await this.getAuthHeaders();
    return this.client.get(url, { ...config, headers: { ...headers, ...(config as any).headers } });
  }

  async post(url: string, data?: any, config = {}) {
    const headers = await this.getAuthHeaders();
    return this.client.post(url, data, { ...config, headers: { ...headers, ...(config as any).headers } });
  }

  async put(url: string, data?: any, config = {}) {
    const headers = await this.getAuthHeaders();
    return this.client.put(url, data, { ...config, headers: { ...headers, ...(config as any).headers } });
  }

  async patch(url: string, data?: any, config = {}) {
    const headers = await this.getAuthHeaders();
    return this.client.patch(url, data, { ...config, headers: { ...headers, ...(config as any).headers } });
  }

  async delete(url: string, config = {}) {
    const headers = await this.getAuthHeaders();
    return this.client.delete(url, { ...config, headers: { ...headers, ...(config as any).headers } });
  }
}

export const apiClient = new ApiClient();
