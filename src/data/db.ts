import * as SQLite from 'expo-sqlite';
import type { ItemMode, Purchase, Receipt } from '../domain/purchase';

const db = SQLite.openDatabaseSync('checar-compras.db');

const DAY = 24 * 60 * 60 * 1000;
/** Receipts and last prices are kept for 30 days (spec 4.9 and 4.10). */
const PRICE_RETENTION = 30 * DAY;

db.execSync(`
  CREATE TABLE IF NOT EXISTS products (
    code TEXT PRIMARY KEY NOT NULL,
    nickname TEXT NOT NULL,
    last_price REAL,
    last_price_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS flv_history (
    key TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    mode TEXT NOT NULL,
    price REAL NOT NULL,
    at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at INTEGER NOT NULL,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`);

export function purgeOld(now: number): void {
  const limit = now - PRICE_RETENTION;
  db.runSync('UPDATE products SET last_price = NULL, last_price_at = NULL WHERE last_price_at < ?', limit);
  db.runSync('DELETE FROM flv_history WHERE at < ?', limit);
  db.runSync('DELETE FROM receipts WHERE at < ?', limit);
}

export interface Product {
  code: string;
  nickname: string;
  lastPrice: number | null;
  lastPriceAt: number | null;
}

export function getProduct(code: string): Product | null {
  const row = db.getFirstSync<{ code: string; nickname: string; last_price: number | null; last_price_at: number | null }>(
    'SELECT * FROM products WHERE code = ?',
    code,
  );
  return row ? { code: row.code, nickname: row.nickname, lastPrice: row.last_price, lastPriceAt: row.last_price_at } : null;
}

/** Saves the nickname and, when known, the price just registered. */
export function saveProduct(code: string, nickname: string, price: number | null, now: number): void {
  if (price == null) {
    db.runSync(
      'INSERT INTO products (code, nickname) VALUES (?, ?) ON CONFLICT(code) DO UPDATE SET nickname = excluded.nickname',
      code,
      nickname,
    );
  } else {
    db.runSync(
      `INSERT INTO products (code, nickname, last_price, last_price_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(code) DO UPDATE SET nickname = excluded.nickname, last_price = excluded.last_price, last_price_at = excluded.last_price_at`,
      code,
      nickname,
      price,
      now,
    );
  }
}

export interface FlvPrice {
  name: string;
  mode: ItemMode;
  price: number;
  at: number;
}

const flvKey = (name: string) => name.trim().toLocaleLowerCase('pt-BR');

export function getFlvPrice(name: string): FlvPrice | null {
  return db.getFirstSync<FlvPrice>('SELECT name, mode, price, at FROM flv_history WHERE key = ?', flvKey(name));
}

export function recentFlv(limit: number): FlvPrice[] {
  return db.getAllSync<FlvPrice>('SELECT name, mode, price, at FROM flv_history ORDER BY at DESC LIMIT ?', limit);
}

export function saveFlvPrice(name: string, mode: ItemMode, price: number, now: number): void {
  db.runSync(
    `INSERT INTO flv_history (key, name, mode, price, at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET name = excluded.name, mode = excluded.mode, price = excluded.price, at = excluded.at`,
    flvKey(name),
    name.trim(),
    mode,
    price,
    now,
  );
}

function getKv<T>(key: string): T | null {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
  return row ? (JSON.parse(row.value) as T) : null;
}

function setKv(key: string, value: unknown): void {
  db.runSync('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, JSON.stringify(value));
}

function deleteKv(key: string): void {
  db.runSync('DELETE FROM kv WHERE key = ?', key);
}

// The purchase in progress is saved on every change, so it survives Android closing the app.
export const loadPurchase = () => getKv<Purchase>('purchase');
export const savePurchase = (p: Purchase) => setKv('purchase', p);
export const clearPurchase = () => deleteKv('purchase');

export const loadTolerance = () => getKv<number>('tolerance') ?? 1;
export const saveTolerance = (v: number) => setKv('tolerance', v);

export const loadMarkets = () => getKv<string[]>('markets') ?? [];
export function rememberMarket(name: string): void {
  const list = [name, ...loadMarkets().filter((m) => m !== name)].slice(0, 6);
  setKv('markets', list);
}

// Concluded purchases (spec 4.9). The receipt is stored as JSON, like the purchase in progress.
export function saveReceipt(r: Receipt): Receipt {
  const { lastInsertRowId } = db.runSync('INSERT INTO receipts (at, data) VALUES (?, ?)', r.at, JSON.stringify(r));
  return { ...r, id: lastInsertRowId };
}

export function updateReceipt(r: Receipt): void {
  db.runSync('UPDATE receipts SET data = ? WHERE id = ?', JSON.stringify(r), r.id);
}

export function deleteReceipt(id: number): void {
  db.runSync('DELETE FROM receipts WHERE id = ?', id);
}

/** Most recent first. */
export function loadReceipts(): Receipt[] {
  return db.getAllSync<{ id: number; data: string }>('SELECT id, data FROM receipts ORDER BY at DESC').map((row) => ({ ...(JSON.parse(row.data) as Receipt), id: row.id }));
}
