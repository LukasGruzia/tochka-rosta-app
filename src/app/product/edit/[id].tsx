import { useLocalSearchParams } from 'expo-router';
import { CustomProductForm } from '@/components/CustomProductForm';
export default function EditProductScreen() { const { id } = useLocalSearchParams<{ id: string }>(); return <CustomProductForm productId={Number(id)}/>; }
