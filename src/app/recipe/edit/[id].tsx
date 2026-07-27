import { useLocalSearchParams } from 'expo-router';
import { RecipeForm } from '@/components/RecipeForm';
export default function EditRecipeScreen() { const { id } = useLocalSearchParams<{ id: string }>(); return <RecipeForm productId={Number(id)}/>; }
