/**
 * Async utilities to replace setTimeout delays with proper async operations
 */

/**
 * Creates a delay using Promise instead of setTimeout
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay in milliseconds
 * @returns Promise that resolves with the function result
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delayMs = baseDelay * Math.pow(2, attempt);
      await delay(delayMs);
    }
  }
  
  throw lastError!;
};

/**
 * Debounce a function call
 * @param fn Function to debounce
 * @param delayMs Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
};

/**
 * Throttle a function call
 * @param fn Function to throttle
 * @param delayMs Delay in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delayMs) {
      lastCall = now;
      fn(...args);
    }
  };
};

/**
 * Poll a function until a condition is met
 * @param fn Function to poll
 * @param condition Condition function that returns true when polling should stop
 * @param intervalMs Polling interval in milliseconds
 * @param maxAttempts Maximum number of polling attempts
 * @returns Promise that resolves with the final result
 */
export const pollUntil = async <T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  intervalMs: number = 1000,
  maxAttempts: number = 30
): Promise<T> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await fn();
    
    if (condition(result)) {
      return result;
    }
    
    if (attempt < maxAttempts - 1) {
      await delay(intervalMs);
    }
  }
  
  throw new Error(`Polling failed after ${maxAttempts} attempts`);
};

/**
 * Execute a function with a timeout
 * @param fn Function to execute
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise that resolves with the function result or rejects on timeout
 */
export const withTimeout = async <T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([fn(), timeoutPromise]);
};

/**
 * Batch process items with a delay between batches
 * @param items Items to process
 * @param processFn Function to process each item
 * @param batchSize Size of each batch
 * @param delayMs Delay between batches in milliseconds
 * @returns Promise that resolves with all results
 */
export const batchProcess = async <T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  batchSize: number = 10,
  delayMs: number = 100
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
    
    if (i + batchSize < items.length) {
      await delay(delayMs);
    }
  }
  
  return results;
};

/**
 * Execute a function with a loading state
 * @param fn Function to execute
 * @param setLoading Loading state setter
 * @returns Promise that resolves with the function result
 */
export const withLoading = async <T>(
  fn: () => Promise<T>,
  setLoading: (loading: boolean) => void
): Promise<T> => {
  setLoading(true);
  try {
    return await fn();
  } finally {
    setLoading(false);
  }
};

/**
 * Execute a function with error handling
 * @param fn Function to execute
 * @param onError Error handler
 * @returns Promise that resolves with the function result or undefined on error
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    const err = error as Error;
    onError?.(err);
    return undefined;
  }
};

/**
 * Create a cancellable promise
 * @param fn Function to execute
 * @returns Object with promise and cancel function
 */
export const createCancellablePromise = <T>(
  fn: (signal: AbortSignal) => Promise<T>
): { promise: Promise<T>; cancel: () => void } => {
  const controller = new AbortController();
  
  const promise = fn(controller.signal);
  
  return {
    promise,
    cancel: () => controller.abort()
  };
};

/**
 * Wait for a condition to be true
 * @param condition Function that returns true when condition is met
 * @param checkIntervalMs Interval to check condition in milliseconds
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise that resolves when condition is met
 */
export const waitFor = async (
  condition: () => boolean,
  checkIntervalMs: number = 100,
  timeoutMs: number = 5000
): Promise<void> => {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Condition not met within ${timeoutMs}ms`);
    }
    await delay(checkIntervalMs);
  }
};

/**
 * Execute a function with a progress callback
 * @param fn Function to execute
 * @param onProgress Progress callback
 * @returns Promise that resolves with the function result
 */
export const withProgress = async <T>(
  fn: (onProgress: (progress: number) => void) => Promise<T>,
  onProgress: (progress: number) => void
): Promise<T> => {
  return fn(onProgress);
}; 