/**
 * HTTP client for the GroupTrip Ledger core backend.
 *
 * Responsibilities:
 * - Read CORE_API_URL from process.env
 * - Perform backend HTTP requests (GET, POST, DELETE)
 * - Parse JSON responses safely
 * - Preserve backend status code and error information
 * - Return structured success/failure results
 * - Never hide backend failures
 * - Never claim a write succeeded on a non-2xx response
 *
 * This module contains NO AI reasoning or financial logic.
 */

export interface CoreApiResult<T = unknown> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
}

function getBaseUrl(): string {
  return process.env.CORE_API_URL || "http://localhost:5000";
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<CoreApiResult<T>> {
  const url = `${getBaseUrl()}${path}`;

  try {
    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      parsed = undefined;
    }

    if (!response.ok) {
      const errorMessage =
        (parsed &&
        typeof parsed === "object" &&
        parsed !== null &&
        "error" in parsed
          ? String((parsed as Record<string, unknown>).error)
          : null) ||
        (parsed &&
        typeof parsed === "object" &&
        parsed !== null &&
        "message" in parsed
          ? String((parsed as Record<string, unknown>).message)
          : null) ||
        `Backend returned status ${response.status}`;

      return {
        success: false,
        status: response.status,
        error: errorMessage,
      };
    }

    return {
      success: true,
      status: response.status,
      data: parsed as T,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error contacting backend";
    return {
      success: false,
      status: 0,
      error: `Backend unavailable: ${message}`,
    };
  }
}

export async function get<T = unknown>(
  path: string
): Promise<CoreApiResult<T>> {
  return request<T>("GET", path);
}

export async function post<T = unknown>(
  path: string,
  body?: unknown
): Promise<CoreApiResult<T>> {
  return request<T>("POST", path, body);
}

export async function del<T = unknown>(
  path: string
): Promise<CoreApiResult<T>> {
  return request<T>("DELETE", path);
}
