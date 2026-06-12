import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('splitsy.db');

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      currency TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY NOT NULL,
      groupId TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      groupId TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      paidByMemberId TEXT NOT NULL,
      splitType TEXT NOT NULL,
      date INTEGER NOT NULL,
      FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expense_shares (
      id TEXT PRIMARY KEY NOT NULL,
      expenseId TEXT NOT NULL,
      memberId TEXT NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (expenseId) REFERENCES expenses(id) ON DELETE CASCADE
    );
  `);
}

export default db;
