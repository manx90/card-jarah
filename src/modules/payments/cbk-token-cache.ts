const g = globalThis as unknown as {
  __cbkTokenStore?: Map<string, { token: string; expiresAt: number }>;
};

/** 2 ساعة − 5 دقائق buffer — مثل payment-gateway */
const TTL_MS = 2 * 60 * 60 * 1000 - 5 * 60 * 1000;
const SKEW_MS = 120_000;

function store(): Map<string, { token: string; expiresAt: number }> {
  if (!g.__cbkTokenStore) g.__cbkTokenStore = new Map();
  return g.__cbkTokenStore;
}

export function cbkTokenCacheKey(clientId: string): string {
  return `cbk_token_${clientId}`;
}

export function readCachedCbkAccessToken(key: string): string | null {
  const e = store().get(key);
  if (!e || e.expiresAt <= Date.now() + SKEW_MS) {
    if (e) store().delete(key);
    return null;
  }
  return e.token;
}

export function writeCachedCbkAccessToken(key: string, token: string): void {
  store().set(key, { token, expiresAt: Date.now() + TTL_MS });
}

export function clearCachedCbkAccessToken(key?: string): void {
  if (key) {
    store().delete(key);
    return;
  }
  store().clear();
}
