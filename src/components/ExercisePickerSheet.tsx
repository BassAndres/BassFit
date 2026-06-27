/**
 * Reusable "Add exercise" bottom sheet: search, muscle filter, and an inline
 * "create custom exercise" form. Used by the live tracker and routine editor.
 *
 * Self-contained: owns its BottomSheetModal and exposes present()/dismiss()
 * through an imperative ref so callers don't manage sheet plumbing.
 */
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';

import { usePalette, spacing, radius, typography } from '@/theme';
import { SegmentedControl } from './SegmentedControl';
import { useCatalogStore } from '@/store/catalogStore';
import { useAuthStore } from '@/store/authStore';
import { useHaptics } from '@/hooks/useHaptics';
import { MUSCLE_LABEL, EQUIPMENT_LABEL, ALL_MUSCLES, ALL_EQUIPMENT } from '@/utils/labels';
import type { Exercise, MuscleGroup, Equipment } from '@/types/models';

export interface ExercisePickerSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  onPick: (exercise: Exercise) => void;
}

let customCounter = 0;

export const ExercisePickerSheet = forwardRef<ExercisePickerSheetRef, Props>(
  ({ onPick }, ref) => {
    const { colors } = usePalette();
    const insets = useSafeAreaInsets();
    const haptics = useHaptics();
    const uid = useAuthStore((s) => s.user?.uid);

    const custom = useCatalogStore((s) => s.custom);
    const addCustom = useCatalogStore((s) => s.addCustom);
    const allFn = useCatalogStore((s) => s.all);

    const sheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['60%', '92%'], []);

    const [search, setSearch] = useState('');
    const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all');
    const [creating, setCreating] = useState(false);

    // New-exercise form state.
    const [newName, setNewName] = useState('');
    const [newMuscle, setNewMuscle] = useState<MuscleGroup>('chest');
    const [newEquip, setNewEquip] = useState<Equipment>('barbell');

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
      ),
      []
    );

    // `custom` is referenced so the memo recomputes when a custom exercise is added.
    const list = useMemo(() => {
      void custom;
      const q = search.trim().toLowerCase();
      return allFn().filter((e) => {
        const matchesQ = !q || e.name.toLowerCase().includes(q);
        const matchesMuscle = muscle === 'all' || e.primaryMuscle === muscle;
        return matchesQ && matchesMuscle;
      });
    }, [allFn, custom, search, muscle]);

    const pick = (exercise: Exercise) => {
      haptics.selection();
      onPick(exercise);
      sheetRef.current?.dismiss();
    };

    const submitCustom = () => {
      if (!newName.trim()) return;
      customCounter += 1;
      const exercise: Exercise = {
        id: `custom_${Date.now().toString(36)}_${customCounter}`,
        name: newName.trim(),
        primaryMuscle: newMuscle,
        secondaryMuscles: [],
        equipment: newEquip,
        isCustom: true,
      };
      if (uid) addCustom(uid, exercise);
      haptics.success();
      setNewName('');
      setCreating(false);
      pick(exercise);
    };

    const muscleOptions: Array<MuscleGroup | 'all'> = ['all', ...ALL_MUSCLES];

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        index={1}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.tertiaryLabel }}
        backgroundStyle={{ backgroundColor: colors.surface }}
      >
        <BottomSheetView style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.label }]}>Añadir ejercicio</Text>
            <Pressable onPress={() => setCreating((c) => !c)} hitSlop={8}>
              <Text style={[styles.create, { color: colors.tint }]}>
                {creating ? 'Cancelar' : '＋ Crear'}
              </Text>
            </Pressable>
          </View>

          {creating ? (
            <View style={styles.form}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.label }]}
                placeholder="Nombre del ejercicio"
                placeholderTextColor={colors.tertiaryLabel}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <Text style={[styles.formLabel, { color: colors.secondaryLabel }]}>Músculo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {ALL_MUSCLES.map((m) => (
                  <Chip key={m} label={MUSCLE_LABEL[m]} active={newMuscle === m} onPress={() => setNewMuscle(m)} />
                ))}
              </ScrollView>
              <Text style={[styles.formLabel, { color: colors.secondaryLabel }]}>Equipo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {ALL_EQUIPMENT.map((eq) => (
                  <Chip key={eq} label={EQUIPMENT_LABEL[eq]} active={newEquip === eq} onPress={() => setNewEquip(eq)} />
                ))}
              </ScrollView>
              <Pressable
                onPress={submitCustom}
                disabled={!newName.trim()}
                style={[styles.saveBtn, { backgroundColor: newName.trim() ? colors.tint : colors.separator }]}
              >
                <Text style={styles.saveText}>Crear y añadir</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.label }]}
                placeholder="Buscar ejercicio…"
                placeholderTextColor={colors.tertiaryLabel}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {muscleOptions.map((m) => (
                  <Chip
                    key={m}
                    label={m === 'all' ? 'Todos' : MUSCLE_LABEL[m]}
                    active={muscle === m}
                    onPress={() => setMuscle(m)}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </BottomSheetView>

        {!creating && (
          <BottomSheetFlatList
            data={list}
            keyExtractor={(item: Exercise) => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            ItemSeparatorComponent={() => (
              <View style={[styles.sep, { backgroundColor: colors.separator }]} />
            )}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.secondaryLabel }]}>
                Sin resultados. Pulsa “＋ Crear” para añadir uno propio.
              </Text>
            }
            renderItem={({ item }: { item: Exercise }) => (
              <Pressable style={styles.row} onPress={() => pick(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.label }]}>
                    {item.name}
                    {item.isCustom ? '  ·  propio' : ''}
                  </Text>
                  <Text style={[styles.meta, { color: colors.secondaryLabel }]}>
                    {MUSCLE_LABEL[item.primaryMuscle]} · {EQUIPMENT_LABEL[item.equipment]}
                  </Text>
                </View>
                <Text style={[styles.add, { color: colors.tint }]}>＋</Text>
              </Pressable>
            )}
          />
        )}
      </BottomSheetModal>
    );
  }
);

ExercisePickerSheet.displayName = 'ExercisePickerSheet';

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.tint : colors.surfaceSecondary,
          borderColor: active ? colors.tint : colors.separator,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.secondaryLabel }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.title3 },
  create: { ...typography.body, fontWeight: '600' },
  input: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    ...typography.body,
  },
  chips: { gap: spacing.xs, paddingVertical: spacing.xs, paddingRight: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: spacing.xs,
  },
  chipText: { ...typography.footnote, fontWeight: '600' },
  form: { gap: spacing.xs },
  formLabel: { ...typography.footnote, marginTop: spacing.xs },
  saveBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveText: { color: '#FFFFFF', ...typography.headline },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: spacing.lg },
  empty: { ...typography.body, textAlign: 'center', padding: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  name: { ...typography.body, fontWeight: '600' },
  meta: { ...typography.footnote, marginTop: 2 },
  add: { fontSize: 24 },
});
