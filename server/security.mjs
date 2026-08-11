import { promisify } from "node:util";
import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, salt, expectedHex] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const derived = Buffer.from(await scryptAsync(password, salt, expected.length));
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function temporaryPassword() {
  return `${randomBytes(5).toString("base64url")}!${randomBytes(5).toString("base64url")}9`;
}

export function normalizeName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
