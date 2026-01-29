/**
 * Clean, robust API caller that avoids try-catch hell
 * Returns discriminated union: { data, error } where one is always null
 */

const API_BASE = "/api/v1";

// HTTP Methods enum
export const METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

export type Method = (typeof METHODS)[keyof typeof METHODS];

// Error types for better error handling
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Discriminated union result types
type SuccessResult<T> = {
  data: T;
  error: null;
};

type ErrorResult = {
  data: null;
  error: ApiError;
};

export type ApiResult<T> = SuccessResult<T> | ErrorResult;

// Options for the API call
interface CallApiOptions<TPayload = unknown> {
  payload?: TPayload;
  headers?: Record<string, string>;
  /**
   * If true, prepends API_BASE to the url
   * @default true
   */
  useBaseUrl?: boolean;
  /**
   * Abort signal for request cancellation
   */
  signal?: AbortSignal;
}

/**
 * Makes an API call and returns a clean { data, error } result
 * No try-catch needed in calling code!
 *
 * @example
 * // GET request
 * const { data, error } = await callApi<Store[]>('/stores', METHODS.GET);
 * if (error) {
 *   console.error(error.message);
 *   return;
 * }
 * // data is typed as Store[]
 * console.log(data);
 *
 * @example
 * // POST request with payload
 * const { data, error } = await callApi<Store>('/stores', METHODS.POST, {
 *   payload: { name: 'New Store', slug: 'new-store' }
 * });
 *
 * @example
 * // With abort controller
 * const controller = new AbortController();
 * const { data, error } = await callApi<Store[]>('/stores', METHODS.GET, {
 *   signal: controller.signal
 * });
 */
export async function callApi<TResponse, TPayload = unknown>(
  url: string,
  method: Method,
  options?: CallApiOptions<TPayload>
): Promise<ApiResult<TResponse>> {
  const { payload, headers = {}, useBaseUrl = true, signal } = options ?? {};

  const fullUrl = useBaseUrl ? `${API_BASE}${url}` : url;

  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    signal,
  };

  // Only add body for methods that support it
  if (payload && method !== METHODS.GET) {
    requestInit.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(fullUrl, requestInit);
    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: responseData?.message ?? responseData?.error ?? getDefaultErrorMessage(response.status),
          status: response.status,
          code: responseData?.code,
        },
      };
    }

    // Handle wrapped responses (common pattern: { data: T })
    // If response has a data property, return that; otherwise return the whole response
    const extractedData = responseData?.data !== undefined ? responseData.data : responseData;

    return {
      data: extractedData as TResponse,
      error: null,
    };
  } catch (err) {
    // Handle network errors, aborts, etc.
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return {
          data: null,
          error: {
            message: "Request was cancelled",
            status: 0,
            code: "ABORT_ERROR",
          },
        };
      }

      return {
        data: null,
        error: {
          message: err.message || "Network error",
          status: 0,
          code: "NETWORK_ERROR",
        },
      };
    }

    return {
      data: null,
      error: {
        message: "An unexpected error occurred",
        status: 0,
        code: "UNKNOWN_ERROR",
      },
    };
  }
}

function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: "Bad request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not found",
    409: "Conflict",
    422: "Validation error",
    429: "Too many requests",
    500: "Internal server error",
    502: "Bad gateway",
    503: "Service unavailable",
    504: "Gateway timeout",
  };
  return messages[status] ?? `Request failed with status ${status}`;
}

// ============================================
// Convenience shortcuts (optional but nice)
// ============================================

export const api = {
  get: <T>(url: string, options?: Omit<CallApiOptions, "payload">) =>
    callApi<T>(url, METHODS.GET, options),

  post: <T, P = unknown>(url: string, payload?: P, options?: Omit<CallApiOptions<P>, "payload">) =>
    callApi<T, P>(url, METHODS.POST, { ...options, payload }),

  put: <T, P = unknown>(url: string, payload?: P, options?: Omit<CallApiOptions<P>, "payload">) =>
    callApi<T, P>(url, METHODS.PUT, { ...options, payload }),

  patch: <T, P = unknown>(url: string, payload?: P, options?: Omit<CallApiOptions<P>, "payload">) =>
    callApi<T, P>(url, METHODS.PATCH, { ...options, payload }),

  delete: <T>(url: string, options?: Omit<CallApiOptions, "payload">) =>
    callApi<T>(url, METHODS.DELETE, options),
};
