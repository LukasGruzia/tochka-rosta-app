import { describe, expect, it } from 'vitest';
import { createJuryDemoState, doesJuryDemoMutateUserData, juryDemoSteps } from './juryDemo';

describe('jury demonstration mode',()=>{
  it('offers a complete 60–90 second guided scenario',()=>{expect(juryDemoSteps).toHaveLength(13);expect(juryDemoSteps[0][0]).toBe('Профиль и норма');expect(juryDemoSteps.at(-1)?.[0]).toBe('Бюджет и покупки');});
  it('uses isolated state and never mutates user data',()=>{expect(createJuryDemoState()).toMatchObject({isolated:true,index:0,mockDiary:{calories:0}});expect(doesJuryDemoMutateUserData()).toBe(false);});
});
