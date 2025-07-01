/**
 * Retries an async function up to maxRetries times with exponential backoff.
 * @param fn - The async function to retry. Receives the current attempt number (1-based).
 * @param maxRetries - Maximum number of attempts (default: 3)
 * @param baseDelayMs - Initial delay in ms (default: 500)
 */
export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}
