import { useRef, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '@/components/AppBackground';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressRing } from '@/components/ProgressRing';
import { useAppStore } from '@/store/appStore';
import { colors, radii, spacing } from '@/theme/tokens';

const slides = [
  { title: 'Питание, рассчитанное под тебя.', text: 'Укажи параметры, активность и цель — приложение рассчитает ориентировочную дневную норму.' },
  { title: 'Рацион из настоящих блюд.', text: 'Не абстрактный список продуктов, а готовые блюда из ассортимента «Точки Роста».' },
  { title: 'Добавляй блюдо одним действием.', text: 'Выбери блюдо в каталоге или отсканируй QR-код на упаковке.' },
  { title: 'Оставайся в Потоке.', text: 'Закрывай дни, сохраняй серию и наблюдай, как регулярность превращается в привычку.' },
];

export default function IntroductionScreen() {
  const { width } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const finish = async () => { await saveDraft({}, 'name'); router.replace('/(onboarding)/name'); };
  const next = () => { if (index === slides.length - 1) void finish(); else scroll.current?.scrollTo({ x: width * (index + 1), animated: true }); };
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}><AppText variant="caption" tone="green">{index + 1}/4</AppText><Pressable accessibilityRole="button" onPress={finish} hitSlop={12}><AppText tone="secondary">Пропустить</AppText></Pressable></View>
        <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd}>
          {slides.map((slide, slideIndex) => (
            <View key={slide.title} style={[styles.slide, { width }]}>
              <View style={styles.visual}>{renderVisual(slideIndex)}</View>
              <View style={styles.copy}><AppText variant="title">{slide.title}</AppText><AppText tone="secondary">{slide.text}</AppText></View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.bottom}>
          <View style={styles.dots}>{slides.map((_, dot) => <View key={dot} style={[styles.dot, dot === index && styles.dotActive]} />)}</View>
          <PrimaryButton label={index === 3 ? 'Настроить мой профиль' : 'Далее'} onPress={next} />
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

function renderVisual(index: number) {
  if (index === 0) return <GlassCard variant="elevated" style={styles.calorieCard}><ProgressRing progress={0.68} size={150} value="2 180" label="ккал в день" /><View style={styles.macroRow}><Macro label="Б" value="136 г"/><Macro label="Ж" value="73 г"/><Macro label="У" value="245 г"/></View></GlassCard>;
  if (index === 1) return <View style={styles.foodStack}>{[['khinkali.jpg','Хинкали ПП'],['caesar.jpg','Салат Цезарь'],['brownie.jpg','Брауни']].map(([image, name], i) => <GlassCard key={name} variant="compact" style={[styles.miniFood, { transform: [{ rotate: `${(i - 1) * 4}deg` }], zIndex: 3 - i }]}><Image source={image === 'khinkali.jpg' ? require('../../../assets/food/khinkali.jpg') : image === 'caesar.jpg' ? require('../../../assets/food/caesar.jpg') : require('../../../assets/food/brownie.jpg')} style={styles.miniImage} contentFit="cover"/><AppText variant="caption" style={styles.miniName}>{name}</AppText></GlassCard>)}</View>;
  if (index === 2) return <GlassCard variant="accent" style={styles.qrCard}><View style={styles.qr}><AppIcon name="qr" size={96} color={colors.textPrimary}/></View><AppText variant="heading">Боул добавлен</AppText><View style={styles.added}><AppIcon name="check" size={18} color={colors.backgroundPrimary}/><AppText variant="caption" style={styles.addedText}>Добавлено</AppText></View></GlassCard>;
  return <GlassCard variant="elevated" style={styles.flowCard}><AppIcon name="flow" size={70} color={colors.greenBright}/><AppText variant="display">7 дней</AppText><AppText tone="secondary">Твоя серия растёт</AppText><View style={styles.milestones}>{[3,7,14,30].map((day) => <View key={day} style={styles.milestone}><AppText variant="caption" tone={day <= 7 ? 'green' : 'muted'}>{day}</AppText></View>)}</View></GlassCard>;
}
function Macro({ label, value }: { label: string; value: string }) { return <View style={styles.macro}><AppText variant="caption" tone="green">{label}</AppText><AppText variant="caption">{value}</AppText></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1 }, top: { height: 54, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, slide: { paddingHorizontal: spacing.lg },
  visual: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center' }, copy: { gap: spacing.md, paddingBottom: spacing.lg }, bottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md },
  dots: { height: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textMuted }, dotActive: { width: 24, backgroundColor: colors.greenPrimary },
  calorieCard: { alignItems: 'center', gap: spacing.md }, macroRow: { flexDirection: 'row', gap: spacing.lg }, macro: { alignItems: 'center', gap: 2 },
  foodStack: { width: '100%', alignItems: 'center' }, miniFood: { width: '76%', flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: -12 }, miniImage: { width: 78, height: 66, borderRadius: radii.sm }, miniName: { flex: 1, fontWeight: '700' },
  qrCard: { width: '80%', alignItems: 'center', gap: spacing.md }, qr: { padding: spacing.md, backgroundColor: colors.backgroundSecondary, borderRadius: radii.md }, added: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.greenPrimary, borderRadius: radii.pill, paddingVertical: 7, paddingHorizontal: 12 }, addedText: { color: colors.backgroundPrimary, fontWeight: '800' },
  flowCard: { width: '82%', alignItems: 'center', gap: spacing.sm }, milestones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }, milestone: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
});
