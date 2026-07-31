import { describe, expect, it, vi } from 'vitest';
import { getBackupFingerprint, summarizeBackup } from './dataRepository';

vi.mock('../database',()=>({getDatabase:vi.fn()}));

const backup={format:'tochka-rosta-backup',version:1,schemaVersion:4,createdAt:'2026-07-28T12:00:00.000Z',avatarIncluded:false,tables:{user_profile:[{id:1,avatar_uri:null}],products:[{id:1,is_user_created:1}],diary_entries:[{id:1}],weekly_plans:[{id:1}],shopping_list_items:[{id:1}],research_sessions:[{id:1}],rhythm_recommendations:[{id:1}],rhythm_preferences:[{id:1}]}} as const;

describe('safe local backup format',()=>{
  it('previews supported entities without claiming an avatar',()=>{expect(summarizeBackup(backup)).toMatchObject({schemaVersion:4,profile:1,customProducts:1,diaryEntries:1,weeklyPlans:1,shoppingItems:1,researchSessions:1,rhythmRecommendations:1,rhythmPreferences:1,avatarIncluded:false});});
  it('creates stable content-sensitive duplicate fingerprints',()=>{expect(getBackupFingerprint(backup)).toBe(getBackupFingerprint(backup));expect(getBackupFingerprint({...backup,tables:{...backup.tables,diary_entries:[{id:2}]}})).not.toBe(getBackupFingerprint(backup));});
  it('rejects unknown versions, tables and malformed rows before restore',()=>{
    expect(()=>summarizeBackup({...backup,schemaVersion:99})).toThrow('не поддерживается');
    expect(()=>summarizeBackup({...backup,tables:{unexpected:[]}})).toThrow('Неизвестная таблица');
    expect(()=>summarizeBackup({...backup,tables:{products:{id:1}}})).toThrow('Некорректная таблица');
  });
});
