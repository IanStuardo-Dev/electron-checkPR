const {
  isRetryableHttpError,
  mapWithConcurrency,
  retryWithBackoff,
} = require('../../../src/shared/request-control');

describe('request-control', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('isRetryableHttpError detecta 429 y 5xx', () => {
    expect(isRetryableHttpError(new Error('request failed (429): retry me'))).toBe(true);
    expect(isRetryableHttpError(new Error('request failed (503): upstream down'))).toBe(true);
    expect(isRetryableHttpError(new Error('request failed (404): nope'))).toBe(false);
    expect(isRetryableHttpError('boom')).toBe(false);
  });

  test('retryWithBackoff reintenta con backoff exponencial y devuelve el resultado', async () => {
    jest.useFakeTimers();
    const task = jest.fn()
      .mockRejectedValueOnce(new Error('failed (429): first'))
      .mockRejectedValueOnce(new Error('failed (500): second'))
      .mockResolvedValue('ok');
    const onRetry = jest.fn();

    const promise = retryWithBackoff(task, { initialDelayMs: 100, onRetry });

    await jest.advanceTimersByTimeAsync(100);
    await jest.advanceTimersByTimeAsync(200);

    await expect(promise).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 100);
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 200);
  });

  test('retryWithBackoff no reintenta errores no reintentables', async () => {
    const task = jest.fn().mockRejectedValue(new Error('failed (400): bad request'));

    await expect(retryWithBackoff(task)).rejects.toThrow('failed (400): bad request');
    expect(task).toHaveBeenCalledTimes(1);
  });

  test('mapWithConcurrency respeta orden de salida y limita paralelismo', async () => {
    let active = 0;
    let maxActive = 0;

    const result = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, value === 1 ? 20 : 5));
      active -= 1;
      return value * 10;
    });

    expect(result).toEqual([10, 20, 30, 40]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
