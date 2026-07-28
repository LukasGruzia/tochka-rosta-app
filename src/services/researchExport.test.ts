import { describe, expect, it } from 'vitest';
import { serializeResearchCsv } from './researchExport';

describe('research export',()=>{
  it('escapes commas, quotes and JSON in a valid CSV row',()=>{const csv=serializeResearchCsv([{session_uuid:'abc',started_at:'2026-07-28T10:00:00Z',completed_at:null,duration_seconds:72,event_type:'tap,primary',screen:'"Поток"',metadata_json:'{"note":"да"}'}]);expect(csv.split('\n')).toHaveLength(2);expect(csv).toContain('"tap,primary"');expect(csv).toContain('""Поток""');expect(csv).toContain('"{""note"":""да""}"');});
});
