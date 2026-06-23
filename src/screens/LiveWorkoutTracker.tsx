/**
 * FASE 5 — LiveWorkoutTracker.
 *
 * The core "in-session" screen. Pulls together every pillar of the brief:
 *  - Glassmorphism: header and exercise cards sit on a BlurView (`GlassCard`),
 *    adapting to light/dark via the theme.
 *  - Bottom Sheet: @gorhom/bottom-sheet `BottomSheetModal` with real physics
 *    presents the "Añadir Ejercicio" picker.
 *  - iOS design: generous touch targets, SF system type, characteristic radii.
 *  - Haptics: expo-haptics fires on every set logged and on key actions.
 *  - Coach Inteligente: `useProgressiveOverload` turns the last completed set
 *    into a `CoachBanner` recommendation.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';

import { usePalette, spacing, radius, typography } from '@/theme';
import { GlassCard } from '@/components/GlassCard';
import { CoachBanner } from '@/components/CoachBanner';
import { SetRow } from '@/components/SetRow';
import { useWorkoutStore } from '@/store/workoutStore';
import { useProgressiveOverload } from '@/hooks/useProgressiveOverload';
import { EXERCISE_CATALOG } from '@/data/exerciseCatalog';
import type { Exercise, WorkoutExercise } from '@/types/models';

export function LiveWorkoutTracker() {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();

  const current = useWorkoutStore((s) => s.current);
  const lastCompletedSet = useWorkoutStore((s) => s.lastCompletedSet);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const completeSet = useWorkoutStore((s) => s.completeSet);
  const clearCoach = useWorkoutStore((s) => s.clearCoach);

  const suggestion = useProgressiveOverload(lastCompletedSet);

  // --- Bottom sheet wiring ---------------------------------------------------
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['55%', '90%'], []);

  const openSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sheetRef.current?.present();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
      />
    ),
    []
  );

  const onPickExercise = useCallback(
    (exercise: Exercise) => {
      Haptics.selectionAsync();
      addExercise(exercise);
      sheetRef.current?.dismiss();
    },
    [addExercise]
  );

  // --- Set actions -----------------------------------------------------------
  const onAddSet = useCallback(
    (ex: WorkoutExercise) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const last = ex.sets[ex.sets.length - 1];
      addSet(ex.exerciseId, {
        weightKg: last?.weightKg ?? 20,
        targetReps: last?.targetReps ?? 10,
        achievedReps: last?.targetReps ?? 10,
        rir: last?.rir ?? 2,
      });
    },
    [addSet]
  );

  const onCompleteSet = useCallback(
    (exerciseId: string, setId: string) => {
      const completed = completeSet(exerciseId, setId);
      // Medium impact when a set is logged; nothing when it's un-checked.
      if (completed) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [completeSet]
  );

  // --- Empty state -----------------------------------------------------------
  if (!current) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.bigTitle, { color: colors.label }]}>BassFit</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
          Sobrecarga progresiva, sin adivinar.
        </Text>
        <PrimaryButton
          label="Empezar entrenamiento"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            startWorkout('Sesión de hoy');
          }}
          color={colors.tint}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Glass header */}
      <GlassCard
        intensity={70}
        cornerRadius={0}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.label }]}>
            {current.name}
          </Text>
          <Text style={[styles.headerMeta, { color: colors.secondaryLabel }]}>
            {current.exercises.length} ejercicios ·{' '}
            {current.exercises.reduce((n, e) => n + e.sets.length, 0)} series
          </Text>
        </View>
      </GlassCard>

      <ScrollView
        contentContainerStyle={{
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + 140,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Coach banner sits above the list, pinned visually to the content */}
        <CoachBanner suggestion={suggestion} onDismiss={clearCoach} />

        {current.exercises.map((ex) => (
          <View key={ex.exerciseId} style={styles.cardWrap}>
            <GlassCard intensity={30}>
              <View style={styles.cardInner}>
                <Text style={[styles.exerciseName, { color: colors.label }]}>
                  {ex.exerciseName}
                </Text>

                <View style={styles.columnsHeader}>
                  <Text style={[styles.colLabel, { color: colors.tertiaryLabel, width: 24 }]}>#</Text>
                  <Text style={[styles.colLabel, { color: colors.tertiaryLabel }]}>KG</Text>
                  <Text style={[styles.colLabel, { color: colors.tertiaryLabel }]}>REPS</Text>
                  <Text style={[styles.colLabel, { color: colors.tertiaryLabel }]}>RIR</Text>
                  <Text style={[styles.colLabel, { color: colors.tertiaryLabel, width: 32 }]} />
                </View>

                {ex.sets.map((s) => (
                  <SetRow
                    key={s.id}
                    set={s}
                    onChange={(patch) => updateSet(ex.exerciseId, s.id, patch)}
                    onToggleComplete={() => onCompleteSet(ex.exerciseId, s.id)}
                  />
                ))}

                <Pressable
                  onPress={() => onAddSet(ex)}
                  style={[styles.addSet, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <Text style={[styles.addSetText, { color: colors.tint }]}>
                    + Añadir serie
                  </Text>
                </Pressable>
              </View>
            </GlassCard>
          </View>
        ))}

        {current.exercises.length === 0 && (
          <Text style={[styles.hint, { color: colors.secondaryLabel }]}>
            Añade tu primer ejercicio para empezar a registrar series.
          </Text>
        )}
      </ScrollView>

      {/* Floating glass action bar */}
      <BlurView
        intensity={80}
        tint={colors.blurTint}
        style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.sm }]}
      >
        <PrimaryButton
          label="Añadir ejercicio"
          onPress={openSheet}
          color={colors.tint}
        />
      </BlurView>

      {/* Add-exercise bottom sheet */}
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        index={0}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.tertiaryLabel }}
        backgroundStyle={{ backgroundColor: colors.surface }}
      >
        <BottomSheetView style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.label }]}>
            Añadir ejercicio
          </Text>
        </BottomSheetView>
        <BottomSheetFlatList
          data={EXERCISE_CATALOG}
          keyExtractor={(item: Exercise) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          ItemSeparatorComponent={() => (
            <View style={[styles.sep, { backgroundColor: colors.separator }]} />
          )}
          renderItem={({ item }: { item: Exercise }) => (
            <Pressable
              style={styles.exercisePickRow}
              onPress={() => onPickExercise(item)}
              android_ripple={{ color: colors.separator }}
            >
              <View>
                <Text style={[styles.pickName, { color: colors.label }]}>
                  {item.name}
                </Text>
                <Text style={[styles.pickMeta, { color: colors.secondaryLabel }]}>
                  {item.primaryMuscle} · {item.equipment}
                </Text>
              </View>
              <Text style={[styles.pickAdd, { color: colors.tint }]}>＋</Text>
            </Pressable>
          )}
        />
      </BottomSheetModal>
    </View>
  );
}

/** iOS-style filled, full-width primary button with light haptic affordance. */
function PrimaryButton({
  label,
  onPress,
  color,
}: {
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: color, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  bigTitle: { ...typography.largeTitle },
  subtitle: { ...typography.body, marginBottom: spacing.xl, textAlign: 'center' },

  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.title2 },
  headerMeta: { ...typography.subhead, marginTop: 2 },

  cardWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  cardInner: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  exerciseName: { ...typography.headline, marginBottom: spacing.xs },

  columnsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  colLabel: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  addSet: {
    marginTop: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  addSetText: { ...typography.callout, fontWeight: '600' },

  hint: {
    ...typography.body,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xxl,
  },

  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.25)',
  },

  primaryBtn: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    ...typography.headline,
  },

  sheetHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetTitle: { ...typography.title3 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: spacing.lg },
  exercisePickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pickName: { ...typography.body, fontWeight: '600' },
  pickMeta: { ...typography.footnote, marginTop: 2, textTransform: 'capitalize' },
  pickAdd: { fontSize: 24, fontWeight: '400' },
});
