interface ApiClientOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class AdminApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NODE_ENV === "production" ? "https://your-domain.com" : "";
  }

  async getAuthToken(): Promise<string | null> {
    // Get token from auth context or localStorage
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("supabase.auth.token");
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.access_token || null;
      }
    }
    return null;
  }

  async request<T>(
    endpoint: string,
    options: ApiClientOptions = {},
  ): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    const token = await this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const config: RequestInit = {
      method,
      headers,
      ...(body && {
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
    };

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, config);

      // Handle different response types
      if (!response.ok) {
        const errorText = await response.clone().text();
        let errorMessage = `HTTP ${response.status}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return {} as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        return text as T;
      }
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      throw error;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: "POST", body });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: "PUT", body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const adminApi = new AdminApiClient();
export default adminApi;
