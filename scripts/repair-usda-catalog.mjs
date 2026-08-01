#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { finalizeCatalogNames } from './import-usda-foods.ts';

const path = resolve(process.argv[2] ?? 'src/database/data/usda-common-foods.json');
const foods = JSON.parse(readFileSync(path, 'utf8'));
const repaired = finalizeCatalogNames(foods);
writeFileSync(path, `${JSON.stringify(repaired, null, 2)}\n`, 'utf8');
const technical = repaired.filter((food) => /вариант\s+\d+/i.test(food.name));
const inactive = repaired.filter((food) => food.isActive === false);
const report = {
  rows: repaired.length,
  technicalNames: technical.length,
  activeRows: repaired.length - inactive.length,
  inactiveRows: inactive.length,
  needsReview: repaired.filter((food) => food.reviewStatus === 'needs_review').length,
  generatedAt: new Date().toISOString(),
};
writeFileSync(resolve('src/database/data/catalog-quality-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report));
