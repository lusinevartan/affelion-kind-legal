import * as SQLite from 'expo-sqlite';
import type { AuraParams, HeartMetrics, PracticeRecord, ScanRecord, VoiceMetrics, WindowMetrics } from '../core/types';

/**
 * Local-only persistence. Scans never leave the device unless the user explicitly exports a
 * portrait. Raw camera frames and audio are never stored; only the derived metrics,
 * the aura parameters, and file URIs for the still and the exported Polaroid.
 */

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function db(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const handle = await SQLite.openDatabaseAsync('affelion-aura.db');
      await handle.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS scans (
          id TEXT PRIMARY KEY NOT NULL,
          created_at INTEGER NOT NULL,
          heart TEXT NOT NULL,
          voice TEXT,
          aura TEXT NOT NULL,
          portrait_uri TEXT,
          still_uri TEXT
        );
        CREATE INDEX IF NOT EXISTS scans_created_at ON scans(created_at DESC);
        CREATE TABLE IF NOT EXISTS kv (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS practice_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          created_at INTEGER NOT NULL,
          scan_id TEXT,
          payload TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS practice_created_at ON practice_sessions(created_at DESC);
      `);
      return handle;
    })();
  }
  return dbPromise;
}

interface ScanRow {
  id: string;
  created_at: number;
  heart: string;
  voice: string | null;
  aura: string;
  portrait_uri: string | null;
  still_uri: string | null;
}

function rowToRecord(r: ScanRow): ScanRecord {
  return {
    id: r.id,
    createdAt: r.created_at,
    heart: JSON.parse(r.heart) as HeartMetrics,
    voice: r.voice ? (JSON.parse(r.voice) as VoiceMetrics) : null,
    aura: JSON.parse(r.aura) as AuraParams,
    portraitUri: r.portrait_uri,
    stillUri: r.still_uri,
  };
}

export function newScanId(): string {
  const t = Date.now().toString(36);
  const r = Math.floor(Math.random() * 0xffffffff).toString(36);
  return `scan_${t}_${r}`;
}

export async function saveScan(record: ScanRecord): Promise<void> {
  const d = await db();
  await d.runAsync(
    `INSERT OR REPLACE INTO scans (id, created_at, heart, voice, aura, portrait_uri, still_uri) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    record.id,
    record.createdAt,
    JSON.stringify(record.heart),
    record.voice ? JSON.stringify(record.voice) : null,
    JSON.stringify(record.aura),
    record.portraitUri,
    record.stillUri,
  );
}

export async function updatePortraitUri(id: string, portraitUri: string): Promise<void> {
  const d = await db();
  await d.runAsync(`UPDATE scans SET portrait_uri = ? WHERE id = ?`, portraitUri, id);
}

export async function listScans(limit = 100): Promise<ScanRecord[]> {
  const d = await db();
  const rows = await d.getAllAsync<ScanRow>(`SELECT * FROM scans ORDER BY created_at DESC LIMIT ?`, limit);
  return rows.map(rowToRecord);
}

export async function getScan(id: string): Promise<ScanRecord | null> {
  const d = await db();
  const row = await d.getFirstAsync<ScanRow>(`SELECT * FROM scans WHERE id = ?`, id);
  return row ? rowToRecord(row) : null;
}

export async function countScans(): Promise<number> {
  const d = await db();
  const row = await d.getFirstAsync<{ n: number }>(`SELECT COUNT(*) as n FROM scans`);
  return row?.n ?? 0;
}

export async function deleteScan(id: string): Promise<void> {
  const d = await db();
  await d.runAsync(`DELETE FROM scans WHERE id = ?`, id);
}

export async function deleteAllScans(): Promise<void> {
  const d = await db();
  await d.execAsync(`DELETE FROM scans; DELETE FROM practice_sessions;`);
}

interface PracticeRow {
  id: string;
  created_at: number;
  scan_id: string | null;
  payload: string;
}

export function newPracticeId(): string {
  return `practice_${Date.now().toString(36)}_${Math.floor(Math.random() * 0xffffffff).toString(36)}`;
}

export async function savePractice(record: PracticeRecord): Promise<void> {
  const d = await db();
  await d.runAsync(
    `INSERT OR REPLACE INTO practice_sessions (id, created_at, scan_id, payload) VALUES (?, ?, ?, ?)`,
    record.id,
    record.createdAt,
    record.scanId,
    JSON.stringify(record),
  );
}

export async function listPractices(limit = 100): Promise<PracticeRecord[]> {
  const d = await db();
  const rows = await d.getAllAsync<PracticeRow>(`SELECT * FROM practice_sessions ORDER BY created_at DESC LIMIT ?`, limit);
  return rows.map((r) => JSON.parse(r.payload) as PracticeRecord);
}

export async function updatePracticePortraits(id: string, before: string | null, after: string | null): Promise<void> {
  const d = await db();
  const row = await d.getFirstAsync<PracticeRow>(`SELECT * FROM practice_sessions WHERE id = ?`, id);
  if (!row) return;
  const rec = JSON.parse(row.payload) as PracticeRecord;
  rec.beforePortraitUri = before ?? rec.beforePortraitUri;
  rec.afterPortraitUri = after ?? rec.afterPortraitUri;
  await d.runAsync(`UPDATE practice_sessions SET payload = ? WHERE id = ?`, JSON.stringify(rec), id);
}

export type { WindowMetrics };

export async function getSetting(key: string): Promise<string | null> {
  const d = await db();
  const row = await d.getFirstAsync<{ value: string }>(`SELECT value FROM kv WHERE key = ?`, key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const d = await db();
  await d.runAsync(`INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)`, key, value);
}

export async function clearSettings(): Promise<void> {
  const d = await db();
  await d.execAsync(`DELETE FROM kv`);
}
