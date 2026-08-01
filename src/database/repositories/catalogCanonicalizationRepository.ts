import type { SQLiteDatabase } from 'expo-sqlite';
import { buildCatalogCanonicalizationPlan, type CatalogCanonicalCandidate, type CatalogCanonicalGroup } from '@/services/catalogCanonicalization';
import { normalizeSearchText } from '@/services/productSearch';

interface CatalogRow {
  id:number;name:string;original_name:string|null;serving_size_g:number;calories_per_100g:number;
  protein_per_100g:number|null;fat_per_100g:number|null;carbs_per_100g:number|null;canonical_key:string|null;
  preparation_state:string|null;source_priority:number;source_type:string;is_user_created:number;barcode:string|null;brand:string|null;
  aliases:string;category:string;merged_into_id:number|null;
}

export interface CatalogCanonicalizationReport {
  status:'dry_run'|'completed'|'failed';beforeCount:number;canonicalCount:number;duplicateCount:number;
  servingOptionCount:number;aliasCount:number;unresolvedCount:number;diversityAddedCount:number;groups:CatalogCanonicalGroup[];
}

function parseAliases(value:string){try{const parsed=JSON.parse(value) as unknown;return Array.isArray(parsed)?parsed.filter((item):item is string=>typeof item==='string'):[];}catch{return[];}}
function toCandidate(row:CatalogRow):CatalogCanonicalCandidate{return{id:row.id,name:row.name,originalName:row.original_name,servingSizeG:row.serving_size_g,caloriesPer100g:row.calories_per_100g,proteinPer100g:row.protein_per_100g,fatPer100g:row.fat_per_100g,carbsPer100g:row.carbs_per_100g,canonicalKey:row.canonical_key,preparationState:row.preparation_state,sourcePriority:row.source_priority,sourceType:row.source_type,isUserCreated:row.is_user_created===1,barcode:row.barcode,brand:row.brand,aliases:parseAliases(row.aliases)};}
const reportKey='catalog-size-v9';

function relationSummarySql(ids:number[]){const placeholders=ids.map(()=>'?').join(',');return{
  favorites:`SELECT COUNT(*) AS count FROM favorites WHERE product_id IN (${placeholders})`,
  recent:`SELECT COUNT(*) AS count FROM diary_entries WHERE product_id IN (${placeholders}) AND deleted_at IS NULL`,
  plans:`SELECT (SELECT COUNT(*) FROM meal_plan_items WHERE product_id IN (${placeholders}))+(SELECT COUNT(*) FROM meal_template_items WHERE product_id IN (${placeholders}))+(SELECT COUNT(*) FROM weekly_plan_items WHERE product_id IN (${placeholders})) AS count`,
  recommendations:`SELECT COUNT(*) AS count FROM rhythm_feedback WHERE product_id IN (${placeholders})`,
};}

async function enrichDryRun(db:SQLiteDatabase,groups:CatalogCanonicalGroup[]){
  const result=[];
  for(const group of groups){
    const ids=group.members.map(item=>item.id);const sql=relationSummarySql(ids);
    const [favorites,recent,plans,recommendations]=await Promise.all([
      db.getFirstAsync<{count:number}>(sql.favorites,...ids),db.getFirstAsync<{count:number}>(sql.recent,...ids),
      db.getFirstAsync<{count:number}>(sql.plans,...ids,...ids,...ids),db.getFirstAsync<{count:number}>(sql.recommendations,...ids),
    ]);
    result.push({canonicalKey:group.canonicalKey,canonicalProduct:{id:group.primary.id,name:group.displayName},sourceProducts:group.members.map(item=>({id:item.id,name:item.name,caloriesPer100g:item.caloriesPer100g,proteinPer100g:item.proteinPer100g,fatPer100g:item.fatPer100g,carbsPer100g:item.carbsPer100g})),servingOptions:group.servingOptions,relations:{favorites:favorites?.count??0,recent:recent?.count??0,plans:plans?.count??0,recommendations:recommendations?.count??0},unresolved:group.unresolved,reason:group.reason});
  }
  return result;
}

async function addAlias(db:SQLiteDatabase,productId:number,alias:string,sourceType:string,now:string){
  const clean=alias.trim();if(!clean)return;
  await db.runAsync(`INSERT OR IGNORE INTO product_aliases(product_id,alias,normalized_alias,source_type,created_at) VALUES(?,?,?,?,?)`,productId,clean,normalizeSearchText(clean),sourceType,now);
}

async function addServingOption(db:SQLiteDatabase,productId:number,option:{label:string;amount:number;unit:string;gramsEquivalent:number;isDefault:boolean;sourceType:string},now:string){
  if(!Number.isFinite(option.gramsEquivalent)||option.gramsEquivalent<=0)return;
  const uuid=`serving-${productId}-${normalizeSearchText(option.label).replace(/\s+/g,'-')}-${Math.round(option.gramsEquivalent*10)}`;
  await db.runAsync(`INSERT INTO product_serving_options(uuid,product_id,label,amount,unit,grams_equivalent,is_default,source_type,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(product_id,label,grams_equivalent) DO UPDATE SET amount=excluded.amount,unit=excluded.unit,is_default=MAX(product_serving_options.is_default,excluded.is_default),updated_at=excluded.updated_at`,uuid,productId,option.label,option.amount,option.unit,option.gramsEquivalent,option.isDefault?1:0,option.sourceType,now,now);
}

async function transferRelations(db:SQLiteDatabase,primaryId:number,secondaryId:number,now:string){
  await db.runAsync('INSERT OR IGNORE INTO favorites(product_id,created_at) SELECT ?,created_at FROM favorites WHERE product_id=?',primaryId,secondaryId);
  await db.runAsync('DELETE FROM favorites WHERE product_id=?',secondaryId);
  for(const table of ['meal_plan_items','meal_template_items','weekly_plan_items','recipe_ingredients','scan_history','rhythm_feedback'])await db.runAsync(`UPDATE ${table} SET product_id=? WHERE product_id=?`,primaryId,secondaryId);
  await db.runAsync(`INSERT INTO rhythm_preferences(entity_type,entity_id,weight,last_decayed_at,updated_at)
    SELECT 'product',?,weight,last_decayed_at,? FROM rhythm_preferences WHERE entity_type='product' AND entity_id=?
    ON CONFLICT(entity_type,entity_id) DO UPDATE SET weight=rhythm_preferences.weight+excluded.weight,updated_at=excluded.updated_at`,String(primaryId),now,String(secondaryId));
  await db.runAsync("DELETE FROM rhythm_preferences WHERE entity_type='product' AND entity_id=?",String(secondaryId));
  await db.runAsync(`INSERT INTO user_product_serving_preferences(product_id,last_amount,last_unit,last_grams_equivalent,usage_count,updated_at)
    SELECT ?,last_amount,last_unit,last_grams_equivalent,usage_count,? FROM user_product_serving_preferences WHERE product_id=?
    ON CONFLICT(product_id) DO UPDATE SET last_amount=CASE WHEN excluded.usage_count>=user_product_serving_preferences.usage_count THEN excluded.last_amount ELSE user_product_serving_preferences.last_amount END,last_unit=CASE WHEN excluded.usage_count>=user_product_serving_preferences.usage_count THEN excluded.last_unit ELSE user_product_serving_preferences.last_unit END,last_grams_equivalent=CASE WHEN excluded.usage_count>=user_product_serving_preferences.usage_count THEN excluded.last_grams_equivalent ELSE user_product_serving_preferences.last_grams_equivalent END,usage_count=user_product_serving_preferences.usage_count+excluded.usage_count,updated_at=excluded.updated_at`,primaryId,now,secondaryId);
  await db.runAsync('DELETE FROM user_product_serving_preferences WHERE product_id=?',secondaryId);
  const secondaryOptions=await db.getAllAsync<{label:string;amount:number;unit:string;grams_equivalent:number;is_default:number;source_type:string}>('SELECT label,amount,unit,grams_equivalent,is_default,source_type FROM product_serving_options WHERE product_id=?',secondaryId);
  for(const option of secondaryOptions)await addServingOption(db,primaryId,{label:option.label,amount:option.amount,unit:option.unit,gramsEquivalent:option.grams_equivalent,isDefault:option.is_default===1,sourceType:option.source_type},now);
  await db.runAsync('DELETE FROM product_serving_options WHERE product_id=?',secondaryId);
}

export async function ensureCatalogCanonicalization(db:SQLiteDatabase,force=false):Promise<CatalogCanonicalizationReport>{
  const existing=await db.getFirstAsync<{status:string;dry_run_json:string}>('SELECT status,dry_run_json FROM catalog_size_migration_reports WHERE migration_key=?',reportKey);
  if(existing?.status==='completed'&&!force){
    const counts=await loadCatalogCanonicalizationDiagnostics(db);return{status:'completed',beforeCount:counts.totalRecords+counts.duplicateRecords,canonicalCount:counts.canonicalProducts,duplicateCount:counts.duplicateRecords,servingOptionCount:counts.servingOptions,aliasCount:counts.aliases,unresolvedCount:counts.unresolvedConflicts,diversityAddedCount:counts.productsAddedForDiversity,groups:[]};
  }
  const rows=await db.getAllAsync<CatalogRow>(`SELECT id,name,original_name,serving_size_g,calories_per_100g,protein_per_100g,fat_per_100g,carbs_per_100g,canonical_key,preparation_state,source_priority,source_type,is_user_created,barcode,brand,aliases,category,merged_into_id FROM products WHERE deleted_at IS NULL`);
  const groups=buildCatalogCanonicalizationPlan(rows.map(toCandidate));
  const dryRun=await enrichDryRun(db,groups);const now=new Date().toISOString();
  const unresolvedCount=groups.filter(group=>group.unresolved).length;const mergeable=groups.filter(group=>!group.unresolved);
  await db.runAsync(`INSERT INTO catalog_size_migration_reports(migration_key,status,before_count,canonical_count,duplicate_count,serving_option_count,alias_count,unresolved_count,diversity_added_count,dry_run_json,error_message,created_at,updated_at) VALUES(?,?,?,?,0,0,0,?,?,?,NULL,?,?)
    ON CONFLICT(migration_key) DO UPDATE SET status=excluded.status,before_count=excluded.before_count,unresolved_count=excluded.unresolved_count,dry_run_json=excluded.dry_run_json,error_message=NULL,updated_at=excluded.updated_at`,reportKey,'dry_run',rows.length,rows.length,unresolvedCount,10,JSON.stringify({generatedAt:now,groups:dryRun}),now,now);
  try{
    await db.withExclusiveTransactionAsync(async txn=>{
      for(const row of rows){
        const target=row.merged_into_id??row.id;
        await addAlias(txn,target,row.name,'existing_name',now);await addAlias(txn,target,row.original_name??'','source_name',now);
        for(const alias of parseAliases(row.aliases))await addAlias(txn,target,alias,'seed',now);
      }
      for(const group of mergeable){
        const primaryId=group.primary.id;
        await txn.runAsync('UPDATE products SET name=?,normalized_name=?,canonical_key=?,preparation_state=?,is_active=1,is_available=1,merged_into_id=NULL,updated_at=? WHERE id=?',group.displayName,normalizeSearchText(group.displayName),group.canonicalKey,group.preparationState,now,primaryId);
        for(const alias of group.aliases)await addAlias(txn,primaryId,alias,'canonicalization',now);
        for(const option of group.servingOptions)await addServingOption(txn,primaryId,option,now);
        for(const secondary of group.members.filter(item=>item.id!==primaryId)){
          await transferRelations(txn,primaryId,secondary.id,now);
          await txn.runAsync('UPDATE products SET canonical_key=?,is_active=0,is_available=0,merged_into_id=?,updated_at=? WHERE id=?',group.canonicalKey,primaryId,now,secondary.id);
        }
      }
      const active=await txn.getAllAsync<{id:number;name:string;serving_size_g:number;category:string;source_type:string}>(`SELECT id,name,serving_size_g,category,source_type FROM products WHERE deleted_at IS NULL AND is_active=1 AND is_available=1`);
      for(const product of active){
        await addServingOption(txn,product.id,{label:'100 г',amount:100,unit:'g',gramsEquivalent:100,isDefault:Math.abs(product.serving_size_g-100)<.1,sourceType:'system'},now);
        if(product.serving_size_g>5&&Math.abs(product.serving_size_g-100)>=.1){const isEgg=/^яйц/iu.test(product.name)&&product.serving_size_g<100;const isDrink=/напит|молоко|кефир|йогурт|сок|кофе|чай/iu.test(`${product.category} ${product.name}`);await addServingOption(txn,product.id,{label:isEgg?'1 шт.':isDrink?`${Math.round(product.serving_size_g)} мл`:'Типичная порция',amount:isEgg?1:product.serving_size_g,unit:isEgg?'piece':isDrink?'ml':'g',gramsEquivalent:product.serving_size_g,isDefault:true,sourceType:product.source_type},now);}
      }
      const counts=await Promise.all([txn.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL AND is_active=1'),txn.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM products WHERE merged_into_id IS NOT NULL'),txn.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM product_serving_options'),txn.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM product_aliases')]);
      await txn.runAsync(`UPDATE catalog_size_migration_reports SET status='completed',canonical_count=?,duplicate_count=?,serving_option_count=?,alias_count=?,unresolved_count=?,diversity_added_count=10,error_message=NULL,updated_at=? WHERE migration_key=?`,counts[0]?.count??0,counts[1]?.count??0,counts[2]?.count??0,counts[3]?.count??0,unresolvedCount,now,reportKey);
    });
  }catch(error){const message=error instanceof Error?error.message:String(error);await db.runAsync(`UPDATE catalog_size_migration_reports SET status='failed',error_message=?,updated_at=? WHERE migration_key=?`,message,new Date().toISOString(),reportKey);throw error;}
  const diagnostics=await loadCatalogCanonicalizationDiagnostics(db);return{status:'completed',beforeCount:rows.length,canonicalCount:diagnostics.canonicalProducts,duplicateCount:diagnostics.duplicateRecords,servingOptionCount:diagnostics.servingOptions,aliasCount:diagnostics.aliases,unresolvedCount,diversityAddedCount:10,groups};
}

export async function loadCatalogCanonicalizationDiagnostics(db:SQLiteDatabase){
  const [total,canonical,duplicates,servings,aliases,unresolved,report]=await Promise.all([
    db.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL'),
    db.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL AND is_active=1'),
    db.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM products WHERE merged_into_id IS NOT NULL'),
    db.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM product_serving_options'),
    db.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM product_aliases'),
    db.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM products WHERE review_status=\'needs_review\''),
    db.getFirstAsync<{dry_run_json:string;diversity_added_count:number;status:string}>('SELECT dry_run_json,diversity_added_count,status FROM catalog_size_migration_reports WHERE migration_key=?',reportKey),
  ]);
  return{totalRecords:total?.count??0,canonicalProducts:canonical?.count??0,duplicateRecords:duplicates?.count??0,servingOptions:servings?.count??0,aliases:aliases?.count??0,unresolvedConflicts:unresolved?.count??0,productsAddedForDiversity:report?.diversity_added_count??0,migrationStatus:report?.status??'pending',dryRunMigration:report?.dry_run_json??'{}'};
}
