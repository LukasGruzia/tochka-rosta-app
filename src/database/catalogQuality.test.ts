import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { migrationV8 } from './migrations/v8';

interface SeedFood { fdcId:number;name: string; originalName: string; aliases: string[]; canonicalKey: string; isActive: boolean; reviewStatus: string; caloriesPer100g: number; proteinPer100g:number|null;fatPer100g:number|null;carbsPer100g:number|null;sourceVersion:string;servingOptions?:{gramsEquivalent:number}[]; }
const foods = JSON.parse(readFileSync(resolve(process.cwd(), 'src/database/data/usda-common-foods.json'), 'utf8')) as SeedFood[];
const active = foods.filter((food) => food.isActive);
const searchable = (food: SeedFood) => [food.name, food.originalName, ...food.aliases].join(' ').toLocaleLowerCase('ru').replace(/ё/g, 'е');

describe('catalog data quality', () => {
  it('contains no technical variant names or active display duplicates', () => {
    expect(foods).toHaveLength(960);
    expect(foods.some((food) => /вариант\s+\d+/i.test(food.name))).toBe(false);
    expect(new Set(active.map((food) => food.name.toLocaleLowerCase('ru'))).size).toBe(active.length);
    expect(new Set(active.map((food) => food.canonicalKey)).size).toBe(active.length);
  });

  it('keeps conflicting nutrient records for review and hides only the lower-priority rows', () => {
    const review = foods.filter((food) => food.reviewStatus === 'needs_review');
    expect(review).toHaveLength(4);
    expect(review.filter((food) => !food.isActive)).toHaveLength(2);
    expect(review.some((food) => food.originalName === 'Broccoli, raw' && food.caloriesPer100g === 31)).toBe(true);
  });

  it.each(['курица', 'куриная грудка', 'гречка', 'гречневая каша', 'рис', 'белый рис', 'коричневый рис', 'лосось', 'семга', 'творог', 'йогурт', 'авокадо', 'тофу', 'овсянка', 'миндаль', 'сыр', 'молоко'])(
    'finds a meaningful active product for "%s"',
    (query) => expect(active.some((food) => searchable(food).includes(query))).toBe(true),
  );

  it.each(['гранат','хурма','арбуз','смородина','цветная капуста','свекла','кабачок','киноа','кус-кус','перловка'])('adds a sourced unique coverage product for "%s"',(query)=>expect(active.some(food=>searchable(food).includes(query))).toBe(true));

  it('keeps the ten diversity additions traceable to official USDA ids and complete core macros',()=>{const ids=new Set([169134,169941,167765,173963,2685573,2685576,2685568,168917,169700,170285]);const added=foods.filter(food=>ids.has(food.fdcId));expect(added).toHaveLength(10);expect(added.every(food=>food.sourceVersion.includes('USDA')||food.sourceVersion.includes('Foundation'))).toBe(true);expect(added.every(food=>[food.caloriesPer100g,food.proteinPer100g,food.fatPer100g,food.carbsPer100g].every(value=>value!=null&&Number.isFinite(value)))).toBe(true);expect(added.every(food=>food.servingOptions?.length)).toBe(true);});

  it('uses a versioned, non-destructive schema migration', () => {
    expect(migrationV8).toContain('canonical_key');
    expect(migrationV8).toContain('product_catalog_backup_v8');
    expect(migrationV8).toContain('catalog_migration_reports');
    expect(migrationV8).not.toMatch(/UPDATE\s+diary_entries/i);
    expect(migrationV8).not.toMatch(/DELETE\s+FROM\s+products/i);
  });
});
