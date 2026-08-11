import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('file:', '') : './dev.db';
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Session (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Post (
    id TEXT PRIMARY KEY,
    content TEXT,
    mediaUrl TEXT,
    mediaType TEXT,
    userId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Follow (
    id TEXT PRIMARY KEY,
    followerId TEXT NOT NULL,
    followingId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(followerId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY(followingId) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(followerId, followingId)
  );

  CREATE TABLE IF NOT EXISTS DownloaderJob (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT NOT NULL,
    quality TEXT DEFAULT '720p',
    sizeBytes INTEGER,
    filePath TEXT,
    error TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE
  );
`);

export default db;
