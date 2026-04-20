/** يجب أن يُحمَّل reflect-metadata قبل أي استيراد لكيانات TypeORM (الديكورات). */
import "reflect-metadata";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from "@/lib/admin-defaults";
import { DEFAULT_CATEGORIES } from "@/lib/category-defaults";
import { Category } from "@/entities/Category";
import { Purchase } from "@/entities/Purchase";
import { Template } from "@/entities/Template";
import { User } from "@/entities/User";
import bcrypt from "bcryptjs";
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

async function seedCategoriesIfEmpty(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Category);
  const count = await repo.count();
  if (count > 0) return;
  await repo.insert(DEFAULT_CATEGORIES);
}

async function seedBootstrapAdminIfNeeded(ds: DataSource): Promise<void> {
  const email =
    process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() || DEFAULT_ADMIN_EMAIL;
  const password =
    process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;

  const repo = ds.getRepository(User);
  const existing = await repo.findOne({ where: { email } });

  if (existing) {
    if (process.env.NODE_ENV === "development") {
      const passwordHash = await bcrypt.hash(password, 12);
      existing.passwordHash = passwordHash;
      existing.role = "admin";
      await repo.save(existing);
      console.log(
        `${ansi.cyan}${ansi.bold}[admin]${ansi.reset} ${ansi.dim}dev: synced bootstrap admin password + role${ansi.reset} → ${email}`,
      );
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = repo.create({
    email,
    passwordHash,
    role: "admin",
  });
  await repo.save(admin);

  if (process.env.NODE_ENV === "development") {
    console.log(
      `${ansi.cyan}${ansi.bold}[admin]${ansi.reset} ${ansi.green}Created bootstrap admin${ansi.reset} → ${ansi.dim}${email}${ansi.reset} (see src/lib/admin-defaults.ts)`,
    );
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

  await seedCategoriesIfEmpty(ds);
  await seedBootstrapAdminIfNeeded(ds);
  globalForDb.dataSource = ds;
  return ds;
}

export async function getCategoryRepository(): Promise<Repository<Category>> {
  return (await getDataSource()).getRepository(Category);
}

export async function getTemplateRepository(): Promise<Repository<Template>> {
  return (await getDataSource()).getRepository(Template);
}

export async function getPurchaseRepository(): Promise<Repository<Purchase>> {
  return (await getDataSource()).getRepository(Purchase);
}

export async function getUserRepository(): Promise<Repository<User>> {
  return (await getDataSource()).getRepository(User);
}
