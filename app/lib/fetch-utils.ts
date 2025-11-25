/**
 * Robust fetch utility with comprehensive error handling and retry logic
 */

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface FetchError extends Error {
  status?: number;
  statusText?: string;
  url?: string;
}

/**
 * Enhanced fetch with timeout, retry logic, and comprehensive error handling
 */
export async function robustFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Merge signal with existing signal if provided
      const signal = fetchOptions.signal
        ? mergeSignals(fetchOptions.signal, controller.signal)
        : controller.signal;

      const response = await fetch(url, {
        ...fetchOptions,
        signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        const error = new Error(
          `HTTP ${response.status}: ${response.statusText}`,
        ) as FetchError;
        error.status = response.status;
        error.statusText = response.statusText;
        error.url = url;
        throw error;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        // Network error - could be connectivity issue
        console.warn(`Network error on attempt ${attempt + 1}:`, error.message);
      } else if (error instanceof Error && error.name === "AbortError") {
        // Timeout error
        console.warn(`Request timeout on attempt ${attempt + 1}:`, url);
      } else {
        // Other errors - don't retry
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw lastError;
      }

      // Wait before retrying
      if (retryDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError!;
}

/**
 * Merge multiple AbortSignals into one
 */
function mergeSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener("abort", () => controller.abort());
  }

  return controller.signal;
}

/**
 * Safe JSON fetch with automatic error handling
 */
export async function fetchJSON<T = any>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  try {
    const response = await robustFetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const text = await response.text();

    if (!text) {
      throw new Error("Empty response body");
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${parseError}`);
    }
  } catch (error) {
    // Log error for debugging but don't expose internal details
    console.error("Fetch error:", {
      url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw with user-friendly message
    if (error instanceof Error && error.message.includes("Failed to fetch")) {
      throw new Error(
        "Network connection failed. Please check your internet connection and try again.",
      );
    }

    throw error;
  }
}

/**
 * Check if error is a network-related error that should be handled gracefully
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.message.includes("Failed to fetch") ||
    error.message.includes("Network request failed") ||
    error.message.includes("TypeError: fetch") ||
    error.name === "AbortError" ||
    error.name === "NetworkError"
  );
}

/**
 * Gracefully handle external service errors without breaking the app
 */
export function handleExternalServiceError(
  error: unknown,
  serviceName: string,
): void {
  if (isNetworkError(error)) {
    console.warn(`${serviceName} service temporarily unavailable:`, error);
    // Could show a toast notification or update UI state here
  } else {
    console.error(`${serviceName} service error:`, error);
  }
}
