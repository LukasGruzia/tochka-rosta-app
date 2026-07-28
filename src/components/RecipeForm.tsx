import { useEffect, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { AppBackground } from "./AppBackground";
import { AppText } from "./AppText";
import { FormField } from "./FormField";
import { GlassCard } from "./GlassCard";
import { PrimaryButton } from "./PrimaryButton";
import {
  loadRecipe,
  saveRecipe,
} from "@/database/repositories/recipeRepository";
import { calculateRecipe } from "@/services/foodMath";
import { searchProducts } from "@/services/productSearch";
import { useAppStore } from "@/store/appStore";
import { radii, spacing } from "@/theme/tokens";
import { useTheme } from "@/theme/ThemeProvider";
import type { Product, RecipeDraft } from "@/types/domain";
import { deleteStoredFoodImage, persistFoodImage } from "@/services/foodImageStorage";

export function RecipeForm({ productId }: { productId?: number }) {
  const { colors } = useTheme();
  const products = useAppStore((state) => state.products);
  const refreshProducts = useAppStore((state) => state.refreshProducts);
  const ensureProductsLoaded = useAppStore(
    (state) => state.ensureProductsLoaded,
  );
  const [draft, setDraft] = useState<RecipeDraft>({
    name: "",
    description: "",
    category: "Мои рецепты",
    imageUri: null,
    servings: 2,
    finalWeightG: null,
    ingredients: [],
  });
  const [servings, setServings] = useState("2");
  const [finalWeight, setFinalWeight] = useState("");
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const originalImage = useRef<string | null>(null);
  const pendingImage = useRef<string | null>(null);
  useEffect(() => {
    if (productId)
      void loadRecipe(productId).then((recipe) => {
        if (recipe) {
          setDraft(recipe);
          originalImage.current = recipe.imageUri;
          setServings(String(recipe.servings));
          setFinalWeight(
            recipe.finalWeightG ? String(recipe.finalWeightG) : "",
          );
        }
      });
  }, [productId]);
  useEffect(() => () => {
    if (pendingImage.current) void deleteStoredFoodImage(pendingImage.current);
  }, []);
  useEffect(() => {
    if (picker) void ensureProductsLoaded();
  }, [ensureProductsLoaded, picker]);
  const calculation = useMemo(() => {
    try {
      return draft.ingredients.length
        ? calculateRecipe(
            draft.ingredients,
            Number(finalWeight) || null,
            Math.max(1, Number(servings) || 1),
          )
        : null;
    } catch {
      return null;
    }
  }, [draft.ingredients, finalWeight, servings]);
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      try {
        const optimized = await persistFoodImage(result.assets[0].uri);
        if (pendingImage.current) await deleteStoredFoodImage(pendingImage.current).catch(() => undefined);
        pendingImage.current = optimized;
        setDraft((current) => ({ ...current, imageUri: optimized }));
      } catch {
        Alert.alert("Не удалось обработать фото", "Попробуй выбрать другое изображение.");
      }
    }
  };
  const addIngredient = (product: Product) => {
    const existing = draft.ingredients.find(
      (item) => item.product.id === product.id,
    );
    setDraft({
      ...draft,
      ingredients: existing
        ? draft.ingredients
        : [...draft.ingredients, { product, amountG: 100 }],
    });
    setPicker(false);
    setQuery("");
  };
  const submit = async () => {
    try {
      setSaving(true);
      const product = await saveRecipe({
        ...draft,
        servings: Math.max(1, Number(servings) || 1),
        finalWeightG: Number(finalWeight) || null,
      });
      pendingImage.current = null;
      if (originalImage.current && originalImage.current !== draft.imageUri) {
        void deleteStoredFoodImage(originalImage.current).catch(() => undefined);
      }
      originalImage.current = draft.imageUri;
      await refreshProducts();
      if (product) router.replace(`/product/${product.id}` as never);
    } catch (error) {
      Alert.alert(
        "Не удалось сохранить рецепт",
        error instanceof Error ? error.message : "Проверь поля",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <AppBackground>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <AppText variant="title">
          {productId ? "Редактировать рецепт" : "Новый рецепт"}
        </AppText>
        <AppText tone="secondary">
          КБЖУ рассчитываются из веса ингредиентов автоматически.
        </AppText>
        <GlassCard style={styles.form}>
          <FormField
            label="Название *"
            value={draft.name}
            onChangeText={(name) => setDraft({ ...draft, name })}
            placeholder="Например, овсяная запеканка"
          />
          <FormField
            label="Описание"
            value={draft.description}
            onChangeText={(description) => setDraft({ ...draft, description })}
            multiline
          />
          <FormField
            label="Категория"
            value={draft.category}
            onChangeText={(category) => setDraft({ ...draft, category })}
          />
          {draft.imageUri ? (
            <Image
              source={{ uri: draft.imageUri }}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={draft.imageUri}
              transition={80}
              style={styles.photo}
            />
          ) : null}
          <PrimaryButton
            label={draft.imageUri ? "Заменить фото" : "Добавить фото"}
            secondary
            onPress={pickImage}
          />
        </GlassCard>
        <GlassCard style={styles.form}>
          <View style={styles.headingRow}>
            <AppText variant="heading">Ингредиенты</AppText>
            <Pressable
              style={[styles.smallAdd, { backgroundColor: colors.greenGlow }]}
              onPress={() => setPicker(true)}
            >
              <AppText tone="green">＋ Добавить</AppText>
            </Pressable>
          </View>
          {!draft.ingredients.length ? (
            <AppText tone="muted">
              Добавь хотя бы один продукт из каталога.
            </AppText>
          ) : (
            draft.ingredients.map((ingredient) => (
              <View
                key={ingredient.product.id}
                style={[
                  styles.ingredient,
                  { borderTopColor: colors.glassBorder },
                ]}
              >
                <View style={styles.ingredientCopy}>
                  <AppText style={styles.bold}>
                    {ingredient.product.name}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {Math.round(
                      (ingredient.product.caloriesPer100g *
                        ingredient.amountG) /
                        100,
                    )}{" "}
                    ккал
                  </AppText>
                </View>
                <TextInput
                  value={String(ingredient.amountG)}
                  keyboardType="decimal-pad"
                  onChangeText={(value) =>
                    setDraft({
                      ...draft,
                      ingredients: draft.ingredients.map((item) =>
                        item.product.id === ingredient.product.id
                          ? {
                              ...item,
                              amountG: Math.max(
                                0,
                                Number(value.replace(",", ".")) || 0,
                              ),
                            }
                          : item,
                      ),
                    })
                  }
                  style={[
                    styles.amount,
                    {
                      color: colors.textPrimary,
                      backgroundColor: colors.surfaceStrong,
                    },
                  ]}
                />
                <AppText variant="caption" tone="secondary">
                  г
                </AppText>
                <Pressable
                  hitSlop={10}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      ingredients: draft.ingredients.filter(
                        (item) => item.product.id !== ingredient.product.id,
                      ),
                    })
                  }
                >
                  <AppText tone="muted">×</AppText>
                </Pressable>
              </View>
            ))
          )}
        </GlassCard>
        <GlassCard style={styles.form}>
          <AppText variant="heading">Выход блюда</AppText>
          <FormField
            label="Количество порций"
            value={servings}
            onChangeText={setServings}
            keyboardType="number-pad"
          />
          <FormField
            label="Вес готового блюда"
            value={finalWeight}
            onChangeText={setFinalWeight}
            keyboardType="decimal-pad"
            suffix="г (необязательно)"
          />
          <AppText variant="caption" tone="muted">
            Если вес готового блюда не указан, используется сумма веса
            ингредиентов.
          </AppText>
        </GlassCard>
        {calculation ? (
          <GlassCard variant="accent" style={styles.summary}>
            <AppText variant="caption" tone="green">
              НА ОДНУ ПОРЦИЮ
            </AppText>
            <AppText variant="title">
              {Math.round(calculation.perServing.calories)} ккал
            </AppText>
            <AppText tone="secondary">
              Б{" "}
              {calculation.perServing.proteinG == null
                ? "—"
                : calculation.perServing.proteinG.toFixed(1)}{" "}
              · Ж{" "}
              {calculation.perServing.fatG == null
                ? "—"
                : calculation.perServing.fatG.toFixed(1)}{" "}
              · У{" "}
              {calculation.perServing.carbsG == null
                ? "—"
                : calculation.perServing.carbsG.toFixed(1)}
            </AppText>
            <AppText variant="caption" tone="muted">
              {Math.round(
                calculation.effectiveWeightG /
                  Math.max(1, Number(servings) || 1),
              )}{" "}
              г в порции
            </AppText>
          </GlassCard>
        ) : null}
        <PrimaryButton
          label={saving ? "Сохраняем…" : "Сохранить рецепт"}
          disabled={saving || !draft.ingredients.length}
          onPress={submit}
        />
        <PrimaryButton label="Отмена" secondary onPress={() => router.back()} />
        <IngredientPicker
          visible={picker}
          products={products.filter(
            (item) => item.sourceType !== "user_recipe",
          )}
          query={query}
          setQuery={setQuery}
          onSelect={addIngredient}
          onClose={() => setPicker(false)}
        />
      </ScrollView>
    </AppBackground>
  );
}
function IngredientPicker({
  visible,
  products,
  query,
  setQuery,
  onSelect,
  onClose,
}: {
  visible: boolean;
  products: Product[];
  query: string;
  setQuery: (query: string) => void;
  onSelect: (product: Product) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const filtered = searchProducts(products, query).slice(0, 40);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.scrim, { backgroundColor: colors.blackScrim }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surfaceSolid,
            borderColor: colors.glassBorderStrong,
          },
        ]}
      >
        <View style={styles.pickerHeader}>
          <AppText variant="heading">Выбрать продукт</AppText>
          <Pressable onPress={onClose}>
            <AppText>×</AppText>
          </Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.search,
            {
              color: colors.textPrimary,
              borderColor: colors.glassBorder,
              backgroundColor: colors.surfaceStrong,
            },
          ]}
        />
        <ScrollView contentContainerStyle={styles.results}>
          {filtered.map((product) => (
            <Pressable
              key={product.id}
              style={[styles.result, { borderBottomColor: colors.glassBorder }]}
              onPress={() => onSelect(product)}
            >
              <View style={styles.ingredientCopy}>
                <AppText style={styles.bold}>{product.name}</AppText>
                <AppText variant="caption" tone="muted">
                  {Math.round(product.caloriesPer100g)} ккал на 100 г
                </AppText>
              </View>
              <AppText tone="green">＋</AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingTop: 64,
    paddingBottom: 60,
    gap: spacing.md,
  },
  form: { gap: spacing.md },
  photo: { width: "100%", aspectRatio: 1.8, borderRadius: radii.md },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallAdd: { padding: spacing.sm, borderRadius: radii.pill },
  ingredient: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ingredientCopy: { flex: 1, gap: 3 },
  bold: { fontWeight: "700" },
  amount: {
    width: 64,
    minHeight: 42,
    fontSize: 16,
    textAlign: "center",
    borderRadius: radii.sm,
  },
  summary: { alignItems: "center", gap: spacing.xs },
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "82%",
    padding: spacing.lg,
    gap: spacing.md,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
  },
  pickerHeader: { flexDirection: "row", justifyContent: "space-between" },
  search: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  results: { paddingBottom: 40 },
  result: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
