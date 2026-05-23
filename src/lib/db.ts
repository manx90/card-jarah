/** يجب أن يُحمَّل reflect-metadata قبل أي استيراد لكيانات TypeORM (الديكورات). */
import "reflect-metadata";
import { logger } from "@/lib/logger";
import { Category } from "@/entities/Category";
import { Purchase } from "@/entities/Purchase";
import { Template } from "@/entities/Template";
import { User } from "@/entities/User";
import { UserDesign } from "@/entities/UserDesign";
import type { Repository } from "typeorm";
import { DataSource } from "typeorm";

const globalForDb = globalThis as unknown as {
  dataSource?: DataSource;
};

const ansi = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function getPostgresUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL غير مُعرَّف");
  }
  if (!/^postgres(ql)?:\/\//i.test(raw)) {
    throw new Error(
      "عيّن DATABASE_URL إلى عنوان PostgreSQL مثل postgres://المستخدم:كلمة_المرور@localhost:5432/jarah (انظر .env.example).",
    );
  }
  return raw;
}

function logDbConnected() {
  if (process.env.NO_COLOR) {
    console.log("[db] Connected to PostgreSQL successfully");
    return;
  }
  console.log(
    `${ansi.cyan}${ansi.bold}[db]${ansi.reset} ${ansi.green}Connected to PostgreSQL successfully${ansi.reset}`,
  );
}

function logDbConnectionFailed(message: string) {
  if (process.env.NO_COLOR) {
    console.error("[db] Connection failed:", message);
    return;
  }
  console.error(
    `${ansi.red}${ansi.bold}[db]${ansi.reset} ${ansi.red}Connection failed:${ansi.reset} ${ansi.dim}${message}${ansi.reset}`,
  );
}

export async function getDataSource(): Promise<DataSource> {
  if (globalForDb.dataSource?.isInitialized) {
    return globalForDb.dataSource;
  }

  const synchronize = process.env.TYPEORM_SYNC === "true";

  const ds = new DataSource({
    type: "postgres",
    url: getPostgresUrl(),
    entities: [User, Category, Template, Purchase, UserDesign],
    synchronize,
    logging: process.env.TYPEORM_LOGGING === "true",
  });

  try {
    await ds.initialize();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logDbConnectionFailed(msg);
    void logger.error("database.connection_failed", { message: msg });
    throw err;
  }

  if (process.env.NODE_ENV === "development") {
    logDbConnected();
  }
  void logger.event("database.connected");

  globalForDb.dataSource = ds;
  return ds;
}

/** أسماء الجداول — البحث بالصنف يفشل لأن الاسم يُصغَّر (User→h) في بناء الإنتاج */
export async function getCategoryRepository(): Promise<Repository<Category>> {
  return (await getDataSource()).getRepository("categories") as Repository<Category>;
}

export async function getTemplateRepository(): Promise<Repository<Template>> {
  return (await getDataSource()).getRepository("templates") as Repository<Template>;
}

export async function getPurchaseRepository(): Promise<Repository<Purchase>> {
  return (await getDataSource()).getRepository("purchases") as Repository<Purchase>;
}

export async function getUserRepository(): Promise<Repository<User>> {
  return (await getDataSource()).getRepository("users") as Repository<User>;
}

export async function getUserDesignRepository(): Promise<Repository<UserDesign>> {
  return (await getDataSource()).getRepository("user_designs") as Repository<UserDesign>;
}
