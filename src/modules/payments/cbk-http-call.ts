import type { AxiosError, AxiosInstance } from "axios";
import type { CbkCredentials } from "./cbk-config";
import {
  logPaymentProviderExchange,
  type PaymentProviderOperation,
} from "./payment-provider-log";

interface CbkHttpCallOptions {
  operation: PaymentProviderOperation;
  creds: CbkCredentials;
  http: AxiosInstance;
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export async function cbkHttpCall<T>(opts: CbkHttpCallOptions): Promise<{
  data: T;
  status: number;
  durationMs: number;
}> {
  const url = `${opts.creds.pgBaseUrl}${opts.path}`;
  const start = Date.now();

  try {
    const res =
      opts.method === "GET"
        ? await opts.http.get<T>(opts.path, { headers: opts.headers })
        : await opts.http.post<T>(opts.path, opts.body, { headers: opts.headers });

    const durationMs = Date.now() - start;
    await logPaymentProviderExchange({
      operation: opts.operation,
      request: {
        method: opts.method,
        url,
        headers: opts.headers,
        body: opts.body,
      },
      response: {
        httpStatus: res.status,
        durationMs,
        body: res.data,
      },
      meta: opts.meta,
    });

    return { data: res.data, status: res.status, durationMs };
  } catch (e) {
    const durationMs = Date.now() - start;
    const ax = e as AxiosError<T>;
    const httpStatus = ax.response?.status;
    const responseBody = ax.response?.data;

    await logPaymentProviderExchange({
      operation: opts.operation,
      request: {
        method: opts.method,
        url,
        headers: opts.headers,
        body: opts.body,
      },
      response: httpStatus
        ? {
            httpStatus,
            durationMs,
            body: responseBody,
          }
        : undefined,
      error: e,
      meta: opts.meta,
    });

    throw e;
  }
}
