type Json = Record<string, unknown> | unknown[];

/**
 * Thin HTTP client for the running API, authenticated the way the dashboard
 * is: a bearer token scoped to one team.
 */
class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  async get<T = Json>(path: string): Promise<T> {
    return await this.request<T>("GET", path);
  }

  async post<T = Json>(path: string, body?: unknown): Promise<T> {
    return await this.request<T>("POST", path, body);
  }

  async patch<T = Json>(path: string, body?: unknown): Promise<T> {
    return await this.request<T>("PATCH", path, body);
  }

  async put<T = Json>(path: string, body?: unknown): Promise<T> {
    return await this.request<T>("PUT", path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `${method} ${path} failed with ${response.status}: ${text.slice(
          0,
          500
        )}`
      );
    }

    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }
}

export default ApiClient;
