/**
 * Polls `probe` until it returns a truthy value. The agent loop is driven by
 * asynchronous events and real LLM calls, so every assertion in the e2e suite
 * has to wait for a state instead of observing a return value.
 */
async function waitFor<T>(
  probe: () => Promise<T | null | undefined | false>,
  {
    timeoutMs = 240_000,
    intervalMs = 1_000,
    description = "condition",
  }: { timeoutMs?: number; intervalMs?: number; description?: string } = {}
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = null;

  while (Date.now() < deadline) {
    try {
      const result = await probe();
      if (result) return result as T;
    } catch (err) {
      lastError = err;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for ${description}` +
      (lastError instanceof Error ? `; last error: ${lastError.message}` : "")
  );
}

export { waitFor };
