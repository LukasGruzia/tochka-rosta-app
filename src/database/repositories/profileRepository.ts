import type { NutritionResult, ProfileDraft, Restriction, SavedProfile } from '@/types/domain';
import { getDatabase } from '../database';

interface ProfileRow {
  id: number; name: string; age: number; calculation_sex: ProfileDraft['calculationSex'];
  height_cm: number; weight_kg: number; activity_level: ProfileDraft['activityLevel']; goal: ProfileDraft['goal'];
  diet_preference: ProfileDraft['dietPreference']; created_at: string; updated_at: string;
  avatar_uri: string | null; water_goal_ml: number;
}
interface TargetRow {
  bmr: number; tdee: number; calories: number; protein_g: number; fat_g: number; carbs_g: number;
  goal: NutritionResult['goal']; activity_factor: number;
}

export async function saveProfileAndTarget(profile: ProfileDraft, target: NutritionResult) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`INSERT INTO user_profile
      (id, name, age, calculation_sex, height_cm, weight_kg, activity_level, goal, diet_preference, avatar_uri, water_goal_ml, created_at, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, age=excluded.age, calculation_sex=excluded.calculation_sex,
      height_cm=excluded.height_cm, weight_kg=excluded.weight_kg, activity_level=excluded.activity_level,
      goal=excluded.goal, diet_preference=excluded.diet_preference, avatar_uri=COALESCE(excluded.avatar_uri,user_profile.avatar_uri),
      water_goal_ml=excluded.water_goal_ml, updated_at=excluded.updated_at`,
      profile.name, profile.age, profile.calculationSex, profile.heightCm, profile.weightKg,
      profile.activityLevel, profile.goal, profile.dietPreference, profile.avatarUri ?? null, profile.waterGoalMl ?? 2000, now, now);
    await txn.runAsync('DELETE FROM user_restrictions WHERE profile_id = 1');
    for (const restriction of profile.restrictions) {
      await txn.runAsync('INSERT INTO user_restrictions (profile_id, restriction) VALUES (1, ?)', restriction);
    }
    await txn.runAsync('DELETE FROM nutrition_targets WHERE profile_id = 1');
    await txn.runAsync(`INSERT INTO nutrition_targets
      (profile_id, bmr, tdee, calories, protein_g, fat_g, carbs_g, goal, activity_factor, created_at, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, target.bmr, target.tdee, target.calories,
      target.proteinG, target.fatG, target.carbsG, target.goal, target.activityFactor, now, now);
  });
}

export async function loadProfileAndTarget(): Promise<{ profile: SavedProfile; target: NutritionResult } | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ProfileRow>('SELECT * FROM user_profile WHERE id = 1');
  const targetRow = await db.getFirstAsync<TargetRow>('SELECT * FROM nutrition_targets WHERE profile_id = 1 ORDER BY id DESC LIMIT 1');
  if (!row || !targetRow) return null;
  const restrictions = await db.getAllAsync<{ restriction: Restriction }>('SELECT restriction FROM user_restrictions WHERE profile_id = 1 ORDER BY id');
  return {
    profile: {
      id: row.id, name: row.name, age: row.age, calculationSex: row.calculation_sex,
      heightCm: row.height_cm, weightKg: row.weight_kg, activityLevel: row.activity_level,
      goal: row.goal, dietPreference: row.diet_preference, restrictions: restrictions.map((item) => item.restriction),
      avatarUri: row.avatar_uri, waterGoalMl: row.water_goal_ml,
      createdAt: row.created_at, updatedAt: row.updated_at,
    },
    target: {
      bmr: targetRow.bmr, tdee: targetRow.tdee, calories: targetRow.calories,
      proteinG: targetRow.protein_g, fatG: targetRow.fat_g, carbsG: targetRow.carbs_g,
      goal: targetRow.goal, activityFactor: targetRow.activity_factor,
    },
  };
}

export async function updateProfileAvatar(avatarUri: string | null) {
  const db = await getDatabase();
  const updatedAt = new Date().toISOString();
  await db.runAsync('UPDATE user_profile SET avatar_uri=?, updated_at=? WHERE id=1', avatarUri, updatedAt);
  return updatedAt;
}

export async function updateWaterGoal(goalMl: number) {
  const normalized = Math.min(5000, Math.max(250, Math.round(goalMl)));
  const db = await getDatabase();
  await db.runAsync('UPDATE user_profile SET water_goal_ml=?, updated_at=? WHERE id=1', normalized, new Date().toISOString());
  return normalized;
}
