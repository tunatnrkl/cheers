import "server-only";
import { Pool } from "pg";

// Geliştirmede hot-reload her seferinde yeni havuz açmasın diye global'de tutulur.
const g = globalThis as unknown as { __pgPool?: Pool };

/** DATABASE_URL yoksa null döner; içerik sayfaları veritabanı olmadan da çalışır. */
export function db(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!g.__pgPool) {
    g.__pgPool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 30_000 });
  }
  return g.__pgPool;
}
