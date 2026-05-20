/** منع طلبات Authenticate متزامنة مكررة — نفس payment-gateway */
export class CbkSingleFlight<K = string, V = unknown> {
  private readonly inflight = new Map<K, Promise<V>>();

  execute(key: K, fn: () => Promise<V>): Promise<V> {
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = fn().finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }
}

const globalFlight = new CbkSingleFlight<string, string>();

export function cbkSingleFlightToken(key: string, fn: () => Promise<string>): Promise<string> {
  return globalFlight.execute(key, fn);
}
