import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export type LogLevel = "info" | "warn" | "error";
export type LogCategory = "error" | "access" | "event" | "auth";

interface LogLine {
  ts: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  meta?: Record<string, unknown>;
}

const LOG_DIR = process.env.LOG_DIR?.trim() || join(process.cwd(), "logs");

function canWriteFiles(): boolean {
  return (
    process.env.NEXT_RUNTIME !== "edge" && process.env.LOG_TO_FILE !== "false"
  );
}

function logFileName(category: LogCategory): string {
  const day = new Date().toISOString().slice(0, 10);
  return join(LOG_DIR, `${day}-${category}.log`);
}

function toConsole(line: LogLine): void {
  const prefix = `[${line.category}]`;
  const payload = line.meta ? ` ${JSON.stringify(line.meta)}` : "";
  if (line.level === "error") {
    console.error(prefix, line.message, payload);
  } else if (line.level === "warn") {
    console.warn(prefix, line.message, payload);
  } else {
    console.log(prefix, line.message, payload);
  }
}

async function writeLine(line: LogLine): Promise<void> {
  toConsole(line);
  if (!canWriteFiles()) return;

  const row = `${JSON.stringify(line)}\n`;
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(logFileName(line.category), row, "utf8");
  } catch (err) {
    console.error("[logger] failed to write log file:", err);
  }
}

function baseMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta || Object.keys(meta).length === 0) return undefined;
  return meta;
}

export function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { message: String(err) };
}

export const logger = {
  error(message: string, meta?: Record<string, unknown>) {
    return writeLine({
      ts: new Date().toISOString(),
      level: "error",
      category: "error",
      message,
      meta: baseMeta(meta),
    });
  },

  warn(message: string, meta?: Record<string, unknown>) {
    return writeLine({
      ts: new Date().toISOString(),
      level: "warn",
      category: "error",
      message,
      meta: baseMeta(meta),
    });
  },

  access(message: string, meta?: Record<string, unknown>) {
    return writeLine({
      ts: new Date().toISOString(),
      level: "info",
      category: "access",
      message,
      meta: baseMeta(meta),
    });
  },

  event(message: string, meta?: Record<string, unknown>) {
    return writeLine({
      ts: new Date().toISOString(),
      level: "info",
      category: "event",
      message,
      meta: baseMeta(meta),
    });
  },

  auth(message: string, meta?: Record<string, unknown>) {
    return writeLine({
      ts: new Date().toISOString(),
      level: "info",
      category: "auth",
      message,
      meta: baseMeta(meta),
    });
  },

  routeError(
    route: string,
    err: unknown,
    meta?: Record<string, unknown>,
  ) {
    return writeLine({
      ts: new Date().toISOString(),
      level: "error",
      category: "error",
      message: `Unhandled route error: ${route}`,
      meta: baseMeta({ route, error: serializeError(err), ...meta }),
    });
  },
};
