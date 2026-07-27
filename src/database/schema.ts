import { migrationV1 } from './migrations/v1';

export const databaseName = 'tochka-rosta.db';
export const migrations = [{ version: 1, up: migrationV1 }] as const;
export const currentDatabaseVersion = migrations.at(-1)?.version ?? 0;
