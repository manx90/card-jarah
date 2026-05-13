/** يجب أن يُحمَّل reflect-metadata قبل أي استيراد لكيانات TypeORM (الديكورات). */
import "reflect-metadata";
import { Category } from "@/entities/Category";
import { Purchase } from "@/entities/Purchase";
import { Template } from "@/entities/Template";
import { User } from "@/entities/User";
import fs from "fs";
import path from "path";
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

function resolveSqliteDatabasePath(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL غير مُعرَّف");
  }
  if (/^(postgres(ql)?|mysql):\/\//i.test(raw)) {
    throw new Error(
      "المشروع يستخدم SQLite. عيّن DATABASE_URL إلى مسار ملف مثل file:./data/jarah.sqlite (انظر .env.example).",
    );
  }
  let p = raw.startsWith("file:") ? raw.slice(5) : raw;
  if (p.startsWith("//")) {
    p = p.slice(2);
  }
  if (path.isAbsolute(p)) {
    return p;
  }
  return path.resolve(process.cwd(), p);
}

function logDbConnected() {
  if (process.env.NO_COLOR) {
    console.log("[db] Connected to SQLite successfully");
    return;
  }
  console.log(
    `${ansi.cyan}${ansi.bold}[db]${ansi.reset} ${ansi.green}Connected to SQLite successfully${ansi.reset}`,
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

async function ensureSqliteCategoryThumbnailColumn(ds: DataSource): Promise<void> {
  if (ds.options.type !== "better-sqlite3") return;
  try {
    await ds.query("SELECT thumbnail_path FROM categories LIMIT 1");
  } catch {
    try {
      await ds.query("ALTER TABLE categories ADD COLUMN thumbnail_path TEXT");
    } catch (e) {
      console.error("[db] could not add categories.thumbnail_path", e);
    }
  }
}

export async function getDataSource(): Promise<DataSource> {
  if (globalForDb.dataSource?.isInitialized) {
    return globalForDb.dataSource;
  }

  const database = resolveSqliteDatabasePath();
  const dir = path.dirname(database);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const synchronize = process.env.TYPEORM_SYNC === "true";

  const ds = new DataSource({
    type: "better-sqlite3",
    database,
    entities: [User, Category, Template, Purchase],
    synchronize,
    logging: process.env.TYPEORM_LOGGING === "true",
  });

  try {
    await ds.initialize();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logDbConnectionFailed(msg);
    throw err;
  }

  if (process.env.NODE_ENV === "development") {
    logDbConnected();
  }

  await ensureSqliteCategoryThumbnailColumn(ds);

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
