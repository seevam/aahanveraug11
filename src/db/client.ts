import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME, MIGRATIONS } from './schema';

let database: SQLite.SQLiteDatabase | null = null;
let opening: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version += 1) {
    const sql = MIGRATIONS[version];
    if (!sql) continue;
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(sql);
    });
    // PRAGMA cannot be parameterised, and `version + 1` is a loop counter, not input.
    await db.execAsync(`PRAGMA user_version = ${version + 1}`);
  }
}

/**
 * Opens the database, enabling foreign keys and WAL, and applies any pending
 * migrations. Concurrent callers share one open promise so the migration only
 * ever runs once.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return Promise.resolve(database);
  if (opening) return opening;

  opening = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      // Foreign keys are off by default in SQLite; our ON DELETE CASCADE rules
      // are load-bearing for deleting a patient.
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await migrate(db);
      database = db;
      return db;
    } catch (error) {
      // Clear the cached promise so a later call can retry rather than
      // resolving forever to the same failure.
      opening = null;
      database = null;
      throw error;
    }
  })();

  return opening;
}

/** Test/debug helper: drops every row while keeping the schema. */
export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync(`
      DELETE FROM doses;
      DELETE FROM reminders;
      DELETE FROM prescriptions;
      DELETE FROM patients;
    `);
  });
}

export function newId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
