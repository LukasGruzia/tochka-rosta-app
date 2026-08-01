import { migrationV1 } from './migrations/v1';
import { migrationV2 } from './migrations/v2';
import { migrationV3 } from './migrations/v3';
import { migrationV4 } from './migrations/v4';
import { migrationV5 } from './migrations/v5';
import { migrationV6 } from './migrations/v6';
import { migrationV7 } from './migrations/v7';
import { migrationV8 } from './migrations/v8';

export const databaseName = 'tochka-rosta.db';
export const migrations = [
  { version: 1, up: migrationV1 },
  { version: 2, up: migrationV2 },
  { version: 3, up: migrationV3 },
  { version: 4, up: migrationV4 },
  { version: 5, up: migrationV5 },
  { version: 6, up: migrationV6 },
  { version: 7, up: migrationV7 },
  { version: 8, up: migrationV8 },
] as const;
export const currentDatabaseVersion = migrations.at(-1)?.version ?? 0;
