/**
 * Unified retry utilities for the GameByte framework.
 * Provides generic retry logic with exponential backoff.
 *
 * @module RetryUtils
 */

/**
 * Retry configuration options.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds before first retry (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds between retries (default: 30000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** HTTP status codes that should not trigger retries */
  nonRetryableStatuses?: number[];
  /** Error patterns that should not trigger retries */
  nonRetryableErrors?: RegExp[];
  /** Callback fired before each retry attempt */
  onRetry?: (attempt: number, error: Error, delay: number) => void;
  /** Callback fired when all retries are exhausted */
  onExhausted?: (error: Error, attempts: number) => void;
}

/**
 * Default retry options.
 */
const DEFAULT_RETRY_OPTIONS: Required<
  Pick<RetryOptions, 'maxRetries' | 'initialDelay' | 'maxDelay' | 'backoffMultiplier'>
> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

/**
 * Default non-retryable HTTP status codes.
 * These indicate client errors or authorization issues that won't be fixed by retrying.
 */
const DEFAULT_NON_RETRYABLE_STATUSES = [400, 401, 403, 404, 405, 410, 422];

/**
 * Default non-retryable error patterns.
 */
const DEFAULT_NON_RETRYABLE_ERRORS = [
  /^404/i,
  /^403/i,
  /^401/i,
  /not found/i,
  /forbidden/i,
  /unauthorized/i,
  /invalid/i,
];

/**
 * Calculate delay for a specific retry attempt using exponential backoff.
 *
 * @param attempt - The current attempt number (0-indexed)
 * @param options - Retry options
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, options: RetryOptions = {}): number {
  const initialDelay = options.initialDelay ?? DEFAULT_RETRY_OPTIONS.initialDelay;
  const maxDelay = options.maxDelay ?? DEFAULT_RETRY_OPTIONS.maxDelay;
  const multiplier = options.backoffMultiplier ?? DEFAULT_RETRY_OPTIONS.backoffMultiplier;

  // Exponential backoff: initialDelay * multiplier^attempt
  const delay = initialDelay * Math.pow(multiplier, attempt);

  // Add some jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();

  return Math.min(delay + jitter, maxDelay);
}

/**
 * Check if an error should trigger a retry.
 *
 * @param error - The error to check
 * @param options - Retry options
 * @returns True if the error is retryable
 */
export function isRetryableError(error: Error, options: RetryOptions = {}): boolean {
  const errorMessage = error.message;
  const nonRetryableErrors = options.nonRetryableErrors ?? DEFAULT_NON_RETRYABLE_ERRORS;

  // Check if error message matches any non-retryable patterns
  for (const pattern of nonRetryableErrors) {
    if (pattern.test(errorMessage)) {
      return false;
    }
  }

  // Check for HTTP status codes in error message
  const nonRetryableStatuses = options.nonRetryableStatuses ?? DEFAULT_NON_RETRYABLE_STATUSES;
  for (const status of nonRetryableStatuses) {
    if (errorMessage.includes(`${status}`) || errorMessage.includes(`HTTP ${status}`)) {
      return false;
    }
  }

  return true;
}

/**
 * Sleep for a specified duration.
 *
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async function with retry logic.
 *
 * @param fn - The async function to execute
 * @param options - Retry options
 * @returns Promise that resolves with the function result
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchData(url),
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_RETRY_OPTIONS.maxRetries;
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (!isRetryableError(lastError, options)) {
        throw lastError;
      }

      // Check if we have more retries
      if (attempt < maxRetries - 1) {
        const delay = calculateBackoffDelay(attempt, options);

        // Call onRetry callback if provided
        if (options.onRetry) {
          options.onRetry(attempt + 1, lastError, delay);
        }

        await sleep(delay);
      }
    }
  }

  // Call onExhausted callback if provided
  if (options.onExhausted) {
    options.onExhausted(lastError, maxRetries);
  }

  throw lastError;
}

/**
 * Execute an async function with timeout.
 *
 * @param fn - The async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutError - Optional error message for timeout
 * @returns Promise that resolves with the function result
 * @throws Error if the function times out
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutError: string = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutError));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Execute an async function with both retry and timeout.
 *
 * @param fn - The async function to execute
 * @param retryOptions - Retry options
 * @param timeoutMs - Timeout per attempt in milliseconds
 * @returns Promise that resolves with the function result
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  retryOptions: RetryOptions = {},
  timeoutMs: number = 30000
): Promise<T> {
  return withRetry(() => withTimeout(fn, timeoutMs, 'Request timeout'), retryOptions);
}

/**
 * Create a retry wrapper with preset options.
 * Useful for creating domain-specific retry functions.
 *
 * @param defaultOptions - Default retry options
 * @returns A retry function with preset options
 *
 * @example
 * ```typescript
 * const fetchWithRetry = createRetryWrapper({
 *   maxRetries: 3,
 *   initialDelay: 500,
 *   onRetry: (attempt) => console.log(`Attempt ${attempt}`)
 * });
 *
 * const data = await fetchWithRetry(() => fetch(url));
 * ```
 */
export function createRetryWrapper(
  defaultOptions: RetryOptions
): <T>(fn: () => Promise<T>, overrides?: RetryOptions) => Promise<T> {
  return <T>(fn: () => Promise<T>, overrides?: RetryOptions): Promise<T> => {
    return withRetry(fn, { ...defaultOptions, ...overrides });
  };
}

/**
 * Asset loading specific retry options with sensible defaults.
 */
export const ASSET_LOADING_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  nonRetryableStatuses: [400, 401, 403, 404, 405, 410, 422],
  nonRetryableErrors: [
    /^404/i,
    /^403/i,
    /^401/i,
    /not found/i,
    /forbidden/i,
    /unauthorized/i,
  ],
};

/**
 * Network request specific retry options.
 */
export const NETWORK_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 5,
  initialDelay: 500,
  maxDelay: 30000,
  backoffMultiplier: 2,
  nonRetryableStatuses: [400, 401, 403, 404],
};

/**
 * Create asset loading retry function with defaults.
 */
export const assetLoadWithRetry = createRetryWrapper(ASSET_LOADING_RETRY_OPTIONS);

/**
 * Create network request retry function with defaults.
 */
export const networkWithRetry = createRetryWrapper(NETWORK_RETRY_OPTIONS);
