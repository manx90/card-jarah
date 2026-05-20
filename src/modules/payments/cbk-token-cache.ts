const g = globalThis as unknown as {
  __cbkAccessToken?: { token: string; expiresAt: number };
};

const TTL_MS = 5.5 * 60 * 60 * 1000;
const SKEW_MS = 120_000;

export function readCachedCbkAccessToken(): string | null {
  const e = g.__cbkAccessToken;
  if (!e || e.expiresAt <= Date.now() + SKEW_MS) return null;
  return e.token;
}

export function writeCachedCbkAccessToken(token: string): void {
  g.__cbkAccessToken = { token, expiresAt: Date.now() + TTL_MS };
}

export function clearCachedCbkAccessToken(): void {
  delete g.__cbkAccessToken;
}
