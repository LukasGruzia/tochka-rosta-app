import type { WaterEntry, WaterSummary } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';
import { getDatabase } from '../database';
import { sumWater } from '@/services/waterMath';
interface Row { id:number; date:string; amount_ml:number; created_at:string; }
const map=(row:Row):WaterEntry=>({id:row.id,date:row.date,amountMl:row.amount_ml,createdAt:row.created_at});
export async function addWater(amountMl:number,date=getLocalDateKey()){const amount=Math.round(amountMl);if(!Number.isFinite(amount)||amount<1||amount>5000)throw new Error('Проверь объём воды');const db=await getDatabase();const result=await db.runAsync('INSERT INTO water_entries(date,amount_ml,created_at) VALUES(?,?,?)',date,amount,new Date().toISOString());return Number(result.lastInsertRowId);}
export async function removeWaterEntry(id:number){const db=await getDatabase();await db.runAsync('DELETE FROM water_entries WHERE id=?',id);}
export async function loadWaterSummary(date=getLocalDateKey()):Promise<WaterSummary>{const db=await getDatabase();const [rows,profile]=await Promise.all([db.getAllAsync<Row>('SELECT * FROM water_entries WHERE date=? ORDER BY id',date),db.getFirstAsync<{water_goal_ml:number}>('SELECT water_goal_ml FROM user_profile WHERE id=1')]);const entries=rows.map(map);return{date,totalMl:sumWater(entries),goalMl:profile?.water_goal_ml??2000,entries};}
