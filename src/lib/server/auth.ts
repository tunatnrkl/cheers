import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db } from "./db";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "pd_session";
const SESSION_DAYS = 30;

export type User = { id: string; email: string; displayName: string | null };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return ["scrypt", salt.toString("hex"), key.toString("hex")].join("$");
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Oturum açar: veritabanına yalnızca token'ın özeti yazılır, çereze token'ın kendisi. */
export async function createSession(userId: string): Promise<void> {
  const pool = db();
  if (!pool) throw new Error("Veritabanı yok");
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await pool.query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [
    sha256(token),
    userId,
    expires,
  ]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db()?.query("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const pool = db();
  if (!pool) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.display_name
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)],
  );
  if (!rows[0]) return null;
  return { id: String(rows[0].id), email: rows[0].email, displayName: rows[0].display_name };
}

export const googleEnabled = () =>
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
