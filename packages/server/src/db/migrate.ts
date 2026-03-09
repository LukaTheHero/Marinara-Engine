// ──────────────────────────────────────────────
// Lightweight Schema Migrations
// ──────────────────────────────────────────────
// Adds missing columns to existing SQLite tables.
// Each migration is idempotent — safe to run on every startup.
import { sql } from "drizzle-orm";
import type { DB } from "./connection.js";

interface ColumnMigration {
  table: string;
  column: string;
  definition: string;
}

const COLUMN_MIGRATIONS: ColumnMigration[] = [
  {
    table: "api_connections",
    column: "enable_caching",
    definition: "TEXT NOT NULL DEFAULT 'false'",
  },
  {
    table: "game_state_snapshots",
    column: "committed",
    definition: "INTEGER NOT NULL DEFAULT 0",
  },
  {
    table: "personas",
    column: "persona_stats",
    definition: "TEXT NOT NULL DEFAULT ''",
  },
  {
    table: "game_state_snapshots",
    column: "persona_stats",
    definition: "TEXT",
  },
];

export async function runMigrations(db: DB) {
  for (const migration of COLUMN_MIGRATIONS) {
    const tableInfo = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(${migration.table})`));
    const hasColumn = tableInfo.some((col) => col.name === migration.column);
    if (!hasColumn) {
      await db.run(sql.raw(`ALTER TABLE ${migration.table} ADD COLUMN ${migration.column} ${migration.definition}`));
    }
  }
}
