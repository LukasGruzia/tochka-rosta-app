import { migrationV1 } from './migrations/v1';
import { migrationV2 } from './migrations/v2';

export const databaseName = 'tochka-rosta.db';
export const migrations = [
  { version: 1, up: migrationV1 },
  { version: 2, up: migrationV2 },
] as const;
export const currentDatabaseVersion = migrations.at(-1)?.version ?? 0;
