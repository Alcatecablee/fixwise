import { createClient } from '@supabase/supabase-js';

interface GitHubApiError {
  message: string;
  documentation_url?: string;
  status?: number;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

interface GitHubApiResponse<T> {
  data: T;
  rateLimit: RateLimitInfo;
  headers: Headers;
}

class GitHubApiClient {
  private baseUrl = 'https://api.github.com';
  private userAgent = 'NeuroLint-Pro/1.0';
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Make authenticated request to GitHub API with proper error handling
   */
  async request<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<GitHubApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': this.userAgent,
      ...options.headers,
    };

    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        // Handle rate limiting
        if (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0') {
          const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0') * 1000;
          const waitTime = Math.max(0, resetTime - Date.now());
          
          if (waitTime > 0) {
            await this.sleep(waitTime);
            retries--;
            continue;
          }
        }

        // Handle other rate limiting scenarios
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
          await this.sleep(retryAfter * 1000);
          retries--;
          continue;
        }

        if (!response.ok) {
          const errorData: GitHubApiError = await response.json().catch(() => ({
            message: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
          }));

          throw new Error(this.formatGitHubError(errorData));
        }

        const data = await response.json();
        const rateLimit = this.parseRateLimitHeaders(response.headers);

        return {
          data,
          rateLimit,
          headers: response.headers,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (4xx)
        if (lastError.message.includes('HTTP 4')) {
          break;
        }

        retries--;
        if (retries > 0) {
          await this.sleep(1000 * (3 - retries)); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Get user repositories with pagination
   */
  async getUserRepositories(
    token: string,
    options: {
      page?: number;
      perPage?: number;
      type?: 'all' | 'owner' | 'member';
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      direction?: 'asc' | 'desc';
    } = {}
  ) {
    const params = new URLSearchParams({
      page: (options.page || 1).toString(),
      per_page: (options.perPage || 30).toString(),
      type: options.type || 'all',
      sort: options.sort || 'updated',
      direction: options.direction || 'desc',
    });

    return this.request<any[]>(`/user/repos?${params}`, token);
  }

  /**
   * Get repository contents recursively
   */
  async getRepositoryContents(
    owner: string,
    repo: string,
    token: string,
    path: string = '',
    ref?: string
  ) {
    const params = new URLSearchParams();
    if (path) params.set('path', path);
    if (ref) params.set('ref', ref);

    const query = params.toString();
    const endpoint = `/repos/${owner}/${repo}/contents${query ? `?${query}` : ''}`;
    
    return this.request<any[]>(endpoint, token);
  }

  /**
   * Get file content
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    token: string,
    ref?: string
  ) {
    const params = new URLSearchParams();
    if (ref) params.set('ref', ref);

    const query = params.toString();
    const endpoint = `/repos/${owner}/${repo}/contents/${path}${query ? `?${query}` : ''}`;
    
    return this.request<any>(endpoint, token);
  }

  /**
   * Create or update file in repository
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    token: string,
    sha?: string
  ) {
    const body: any = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
    };

    if (sha) {
      body.sha = sha;
    }

    return this.request<any>(`/repos/${owner}/${repo}/contents/${path}`, token, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * Get GitHub user information
   */
  async getUser(token: string) {
    return this.request<any>('/user', token);
  }

  /**
   * Check repository access and permissions
   */
  async checkRepositoryAccess(
    owner: string,
    repo: string,
    token: string
  ) {
    try {
      await this.request<any>(`/repos/${owner}/${repo}`, token);
      return { hasAccess: true };
    } catch (error) {
      return { hasAccess: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get rate limit information
   */
  async getRateLimit(token: string) {
    return this.request<any>('/rate_limit', token);
  }

  /**
   * Validate and refresh token if needed
   */
  async validateToken(token: string): Promise<{ valid: boolean; user?: any; error?: string }> {
    try {
      const user = await this.getUser(token);
      return { valid: true, user: user.data };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Token validation failed' 
      };
    }
  }

  /**
   * Update GitHub integration in database
   */
  async updateIntegration(userId: string, integrationData: any) {
    const { error } = await this.supabase
      .from('github_integrations')
      .upsert(integrationData, {
        onConflict: 'user_id,github_user_id'
      });

    if (error) {
      throw new Error(`Failed to update integration: ${error.message}`);
    }
  }

  /**
   * Get stored integration for user
   */
  async getIntegration(userId: string) {
    const { data, error } = await this.supabase
      .from('github_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      throw new Error(`Failed to get integration: ${error.message}`);
    }

    return data;
  }

  private formatGitHubError(error: GitHubApiError): string {
    if (error.status === 401) {
      return 'GitHub authentication failed. Please reconnect your GitHub account.';
    }
    if (error.status === 403) {
      return 'Access denied. Please check your repository permissions.';
    }
    if (error.status === 404) {
      return 'Repository not found or access denied.';
    }
    if (error.status === 422) {
      return 'Invalid request. Please check your repository details.';
    }
    
    return error.message || 'GitHub API request failed';
  }

  private parseRateLimitHeaders(headers: Headers): RateLimitInfo {
    return {
      limit: parseInt(headers.get('X-RateLimit-Limit') || '0'),
      remaining: parseInt(headers.get('X-RateLimit-Remaining') || '0'),
      reset: parseInt(headers.get('X-RateLimit-Reset') || '0') * 1000,
      used: parseInt(headers.get('X-RateLimit-Used') || '0'),
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const githubApiClient = new GitHubApiClient();
export default githubApiClient; 