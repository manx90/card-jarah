import axios, { type AxiosInstance } from "axios";
import http from "node:http";
import https from "node:https";
import type { CbkCredentials } from "./cbk-config";

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
});
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
});

export function getCbkRequestTimeoutMs(): number {
  const n = Number(process.env.CBK_REQUEST_TIMEOUT);
  return Number.isFinite(n) && n > 0 ? n : 30_000;
}

export function createCbkHttpClient(creds: CbkCredentials): AxiosInstance {
  return axios.create({
    baseURL: creds.pgBaseUrl,
    timeout: getCbkRequestTimeoutMs(),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    httpAgent,
    httpsAgent,
  });
}

export function cbkBasicAuthHeader(
  clientId: string,
  clientSecret: string,
): Record<string, string> {
  const raw = `${clientId}:${clientSecret}`;
  const b64 = Buffer.from(raw, "utf8").toString("base64");
  return { Authorization: `Basic ${b64}` };
}
