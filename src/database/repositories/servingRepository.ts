import type { ServingOption, ServingUnit, UserProductServingPreference } from '@/types/domain';
import { getDatabase } from '../database';

interface ServingRow {id:number;uuid:string;product_id:number;label:string;amount:number;unit:ServingUnit;grams_equivalent:number;is_default:number;source_type:string;created_at:string;updated_at:string;}
interface PreferenceRow {id:number;product_id:number;last_amount:number;last_unit:ServingUnit;last_grams_equivalent:number;usage_count:number;updated_at:string;}
const mapServing=(row:ServingRow):ServingOption=>({id:row.id,uuid:row.uuid,productId:row.product_id,label:row.label,amount:row.amount,unit:row.unit,gramsEquivalent:row.grams_equivalent,isDefault:row.is_default===1,sourceType:row.source_type,createdAt:row.created_at,updatedAt:row.updated_at});
const mapPreference=(row:PreferenceRow):UserProductServingPreference=>({id:row.id,productId:row.product_id,lastAmount:row.last_amount,lastUnit:row.last_unit,lastGramsEquivalent:row.last_grams_equivalent,usageCount:row.usage_count,updatedAt:row.updated_at});

export async function loadProductServingOptions(productId:number){const db=await getDatabase();const rows=await db.getAllAsync<ServingRow>('SELECT * FROM product_serving_options WHERE product_id=? ORDER BY is_default DESC,grams_equivalent,label',productId);return rows.map(mapServing);}
export async function loadProductServingPreference(productId:number){const db=await getDatabase();const row=await db.getFirstAsync<PreferenceRow>('SELECT * FROM user_product_serving_preferences WHERE product_id=?',productId);return row?mapPreference(row):null;}
export async function recordProductServingPreference(productId:number,grams:number,unit:ServingUnit='g',amount=grams){if(!Number.isFinite(grams)||grams<=0)return;const db=await getDatabase();const now=new Date().toISOString();await db.runAsync(`INSERT INTO user_product_serving_preferences(product_id,last_amount,last_unit,last_grams_equivalent,usage_count,updated_at) VALUES(?,?,?,?,1,?) ON CONFLICT(product_id) DO UPDATE SET last_amount=excluded.last_amount,last_unit=excluded.last_unit,last_grams_equivalent=excluded.last_grams_equivalent,usage_count=user_product_serving_preferences.usage_count+1,updated_at=excluded.updated_at`,productId,amount,unit,grams,now);}

export function chooseInitialServing(options:ServingOption[],preference:UserProductServingPreference|null,fallbackGrams:number){if(preference)return preference.lastGramsEquivalent;return options.find(option=>option.isDefault)?.gramsEquivalent??(fallbackGrams>0?fallbackGrams:100);}
