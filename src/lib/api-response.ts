import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string };
}

export function jsonSuccess<T>(data: T, init?: ResponseInit): NextResponse {
  const body: ApiSuccess<T> = { success: true, data };
  return NextResponse.json(body, init);
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  logMeta?: Record<string, unknown>,
): NextResponse {
  if (status >= 500) {
    void logger.error(`API error ${code}`, {
      code,
      message,
      status,
      ...logMeta,
    });
  }
  const body: ApiErrorBody = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}
