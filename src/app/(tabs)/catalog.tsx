import { useState } from 'react';
import { Image } from 'expo-image';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { productAssets } from '@/constants/productAssets';
import { useAppStore } from '@/store/appStore';
import { radii, spacing } from '@/theme/tokens';

export default function CatalogScreen() {
  const products = useAppStore((state) => state.products);
  const addProduct = useAppStore((state) => state.addProduct);
  const [adding, setAdding] = useState<number | null>(null);
  const add = async (id: number) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    try { setAdding(id); await addProduct(product); Alert.alert('Добавлено', `${product.name} добавлено в перекус.`); }
    catch (error) { Alert.alert('Не удалось добавить', error instanceof Error ? error.message : 'Попробуй ещё раз'); }
    finally { setAdding(null); }
  };
  return <TabScreen title="Каталог" subtitle="Первые блюда Точки Роста — уже в локальной базе.">
    {products.map((product) => <GlassCard key={product.id} variant="default" style={styles.card}>
      <Image source={productAssets[product.imageKey]} contentFit="cover" style={styles.image} accessibilityLabel={product.name}/>
      <View style={styles.copy}><AppText variant="heading">{product.name}</AppText><AppText variant="caption" tone="secondary">{product.description}</AppText>
        <View style={styles.stats}><AppText variant="caption" tone="green">{Math.round(product.calories)} ккал</AppText><AppText variant="caption" tone="secondary">Б {product.proteinG} · Ж {product.fatG} · У {product.carbsG}</AppText></View>
        <AppText variant="caption" tone="muted">Демонстрационные значения · {product.price} ₽</AppText>
        <PrimaryButton label={adding === product.id ? 'Добавляем…' : 'Добавить в перекус'} disabled={adding !== null} onPress={() => add(product.id)} />
      </View>
    </GlassCard>)}
  </TabScreen>;
}
const styles = StyleSheet.create({ card: { padding: 0 }, image: { width: '100%', height: 180, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg }, copy: { padding: spacing.md, gap: spacing.sm }, stats: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' } });
