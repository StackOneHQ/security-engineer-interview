import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "gateway.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id      TEXT PRIMARY KEY,
      name    TEXT NOT NULL,
      api_key TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id            TEXT PRIMARY KEY,
      tenant_id     TEXT NOT NULL,
      provider      TEXT NOT NULL,
      external_id   TEXT NOT NULL,
      base_url      TEXT NOT NULL,
      access_token  TEXT,
      refresh_token TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export interface Tenant {
  id: string;
  name: string;
  api_key: string;
}

export interface Account {
  id: string;
  tenant_id: string;
  provider: string;
  external_id: string;
  base_url: string;
  access_token: string | null;
  refresh_token: string | null;
  created_at: string;
}
