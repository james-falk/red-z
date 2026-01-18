import axios, { AxiosInstance } from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
    });
  }

  async getAuthHeaders() {
    const session = await getSession();
    if (session?.user) {
      const token = (session as any).accessToken;
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    }
    return {};
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
