import { readFile, readdir } from "node:fs/promises";
import pg from "pg";

const { Client } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const sql = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(sql);
  const migrationsUrl = new URL("./migrations/", import.meta.url);
  const migrations = (await readdir(migrationsUrl)).filter((name) => name.endsWith(".sql")).sort();
  for (const migration of migrations) {
    await client.query(await readFile(new URL(migration, migrationsUrl), "utf8"));
    console.log(`Applied ${migration}.`);
  }
  console.log("Database schema is ready.");
} finally {
  await client.end();
}
