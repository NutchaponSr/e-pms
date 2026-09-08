import dns from "node:dns";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

dns.setDefaultResultOrder("ipv4first");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  keepAlive: true,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 60_000,
  ssl: { rejectUnauthorized: true },
});

export const seedDb = new PrismaClient({
  adapter: new PrismaPg(pool),
});

export async function connectSeedDb(attempts = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await seedDb.$connect();
      await seedDb.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      lastError = error;
      console.warn(`DB connect failed (${attempt}/${attempts}), retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 2_000 * attempt));
    }
  }

  throw lastError;
}

export async function disconnectSeedDb() {
  await seedDb.$disconnect();
  await pool.end();
}

export async function findInChunks<Id, Row>(
  ids: Id[],
  query: (chunk: Id[]) => Promise<Row[]>,
  size = 80,
) {
  const rows: Row[] = [];

  for (let index = 0; index < ids.length; index += size) {
    const chunk = ids.slice(index, index + size);
    if (chunk.length === 0) continue;
    rows.push(...(await query(chunk)));
  }

  return rows;
}

export async function runInChunks<T>(
  items: T[],
  size: number,
  run: (chunk: T[]) => Promise<void>,
) {
  for (let index = 0; index < items.length; index += size) {
    const chunk = items.slice(index, index + size);
    if (chunk.length === 0) continue;
    await run(chunk);
  }
}
