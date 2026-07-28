import type { WeightLog, WeightProgress } from '@/types/domain';
import { getDatabase } from '../database';
import { calculateWeightProgress } from '../../services/weightProgress';

interface Row { id: number; date: string; weight_kg: number; note: string; created_at: string; updated_at: string; }
const map = (row: Row): WeightLog => ({ id: row.id, date: row.date, weightKg: row.weight_kg, note: row.note, createdAt: row.created_at, updatedAt: row.updated_at });
export async function loadWeightLogs(from?: string) { const db = await getDatabase(); const rows = await db.getAllAsync<Row>(`SELECT * FROM weight_logs ${from ? 'WHERE date>=?' : ''} ORDER BY date`, ...(from ? [from] : [])); return rows.map(map); }
export async function saveWeightLog(input: { id?: number; date: string; weightKg: number; note?: string }) { if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('Проверь дату'); if (!Number.isFinite(input.weightKg) || input.weightKg < 20 || input.weightKg > 400) throw new Error('Проверь вес'); const db = await getDatabase(); const now = new Date().toISOString(); if (input.id) await db.runAsync('UPDATE weight_logs SET date=?,weight_kg=?,note=?,updated_at=? WHERE id=?',input.date,input.weightKg,input.note?.trim()??'',now,input.id); else await db.runAsync(`INSERT INTO weight_logs(date,weight_kg,note,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(date) DO UPDATE SET weight_kg=excluded.weight_kg,note=excluded.note,updated_at=excluded.updated_at`,input.date,input.weightKg,input.note?.trim()??'',now,now); }
export async function deleteWeightLog(id: number) { const db = await getDatabase(); await db.runAsync('DELETE FROM weight_logs WHERE id=?',id); }
export async function loadWeightProgress(from?: string): Promise<WeightProgress> { return calculateWeightProgress(await loadWeightLogs(from)); }
