import { beforeEach,describe,expect,it,vi } from 'vitest';
import { chooseInitialServing, loadProductServingOptions, loadProductServingPreference, recordProductServingPreference } from './servingRepository';
import { getDatabase } from '../database';

vi.mock('../database',()=>({getDatabase:vi.fn()}));
const db={getAllAsync:vi.fn(),getFirstAsync:vi.fn(),runAsync:vi.fn()};
beforeEach(()=>{vi.clearAllMocks();vi.mocked(getDatabase).mockResolvedValue(db as never);});

describe('product serving preferences',()=>{
  it('loads options only for the opened product',async()=>{db.getAllAsync.mockResolvedValue([{id:1,uuid:'s',product_id:7,label:'1 шт.',amount:1,unit:'piece',grams_equivalent:120,is_default:1,source_type:'USDA',created_at:'a',updated_at:'b'}]);expect((await loadProductServingOptions(7))[0].gramsEquivalent).toBe(120);expect(db.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE product_id=?'),7);});
  it('prefers the last personal amount over the system default',()=>{const option={id:1,uuid:'s',productId:1,label:'100 г',amount:100,unit:'g' as const,gramsEquivalent:100,isDefault:true,sourceType:'system',createdAt:'',updatedAt:''};const preference={id:1,productId:1,lastAmount:120,lastUnit:'g' as const,lastGramsEquivalent:120,usageCount:3,updatedAt:''};expect(chooseInitialServing([option],preference,80)).toBe(120);expect(chooseInitialServing([option],null,80)).toBe(100);});
  it('upserts and increments usage without changing the system option',async()=>{await recordProductServingPreference(5,120);expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('usage_count=user_product_serving_preferences.usage_count+1'),5,120,'g',120,expect.any(String));});
  it('restores the saved value after a repository reload',async()=>{db.getFirstAsync.mockResolvedValue({id:2,product_id:5,last_amount:120,last_unit:'g',last_grams_equivalent:120,usage_count:2,updated_at:'now'});expect((await loadProductServingPreference(5))?.lastGramsEquivalent).toBe(120);});
});
