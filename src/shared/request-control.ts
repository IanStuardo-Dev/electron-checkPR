interface RetryOptions {
  retries?: number;
  initialDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 250;

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export function isRetryableHttpError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const statusMatch = error.message.match(/\((\d{3})\)/);
  if (!statusMatch) {
    return false;
  }

  const status = Number(statusMatch[1]);
  return status === 429 || status >= 500;
}

export async function retryWithBackoff<T>(
  task: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  const initialDelayMs = options.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const shouldRetry = options.shouldRetry ?? isRetryableHttpError;
  const onRetry = options.onRetry;

  let attempt = 0;

  while (true) {
    try {
      return await task();
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }

      const delayMs = initialDelayMs * (2 ** attempt);
      onRetry?.(attempt + 1, error, delayMs);
      attempt += 1;
      await wait(delayMs);
    }
  }
}

export async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  limit: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
): Promise<TOutput[]> {
  const results: TOutput[] = new Array(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
