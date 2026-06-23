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
 *
 * On finish, the session is finalized via the store and persisted to Firestore
 * (`saveWorkout`). A rest countdown (`useRestTimer`) starts after each logged
 * set and surfaces as a floating glass bar.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { RestTimerBar } from '@/components/RestTimerBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useWorkoutStore } from '@/store/workoutStore';
import { useAuthStore } from '@/store/authStore';
import { useProgressiveOverload } from '@/hooks/useProgressiveOverload';
import { useRestTimer } from '@/hooks/useRestTimer';
import { saveWorkout } from '@/services/workoutRepository';
import { EXERCISE_CATALOG } from '@/data/exerciseCatalog';
import { formatVolume } from '@/utils/format';
import type { RootStackParamList } from '@/navigation/types';
import type { Exercise, WorkoutExercise } from '@/types/models';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LiveWorkout'>;

export function LiveWorkoutTracker() {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const uid = useAuthStore((s) => s.user?.uid);
  const current = useWorkoutStore((s) => s.current);
  const lastCompletedSet = useWorkoutStore((s) => s.lastCompletedSet);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const completeSet = useWorkoutStore((s) => s.completeSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const clearCoach = useWorkoutStore((s) => s.clearCoach);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);

  const suggestion = useProgressiveOverload(lastCompletedSet);

  const [restTotal, setRestTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const rest = useRestTimer(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  );

  // --- Bottom sheet wiring ---------------------------------------------------
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['55%', '90%'], []);

  const openSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sheetRef.current?.present();
  }, []);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
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
    (ex: WorkoutExercise, setId: string) => {
      const completed = completeSet(ex.exerciseId, setId);
      if (completed) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRestTotal(ex.restSeconds);
        rest.start(ex.restSeconds);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [completeSet, rest]
  );

  // --- Finish / cancel -------------------------------------------------------
  const onFinish = useCallback(() => {
    if (!current || !uid) return;
    const completedSets = current.exercises.reduce(
      (n, e) => n + e.sets.filter((s) => s.completed).length,
      0
    );
    if (completedSets === 0) {
      Alert.alert('Sin series', 'Marca al menos una serie como completada para guardar.');
      return;
    }
    Alert.alert('Finalizar entrenamiento', '¿Guardar esta sesión en tu historial?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Guardar',
        style: 'default',
        onPress: async () => {
          const workout = finishWorkout(uid);
          if (!workout) return;
          setSaving(true);
          rest.stop();
          try {
            await saveWorkout(workout);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              '¡Sesión guardada! 🎉',
              `Volumen: ${formatVolume(workout.totals.volumeKg)}\n` +
                `Series: ${workout.totals.setCount}\n` +
                `Mejor 1RM est.: ${workout.totals.bestEstimated1RM} kg`
            );
          } catch {
            Alert.alert(
              'Guardado local',
              'No se pudo subir a Firestore (revisa tu configuración). La sesión se cerró igualmente.'
            );
          } finally {
            setSaving(false);
            navigation.goBack();
          }
        },
      },
    ]);
  }, [current, uid, finishWorkout, navigation, rest]);

  const onCancel = useCallback(() => {
    Alert.alert('Descartar entrenamiento', 'Se perderán las series no guardadas.', [
      { text: 'Seguir', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          rest.stop();
          cancelWorkout();
          navigation.goBack();
        },
      },
    ]);
  }, [cancelWorkout, navigation, rest]);

  // --- Empty fallback (no active session) ------------------------------------
  if (!current) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.bigTitle, { color: colors.label }]}>Sin sesión activa</Text>
        <PrimaryButton
          label="Empezar entrenamiento vacío"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            startWorkout('Sesión de hoy');
          }}
          style={styles.fallbackBtn}
        />
        <PrimaryButton label="Volver" variant="tinted" onPress={() => navigation.goBack()} style={styles.fallbackBtn} />
      </View>
    );
  }

  const totalSets = current.exercises.reduce((n, e) => n + e.sets.length, 0);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Glass header with cancel / finish */}
      <GlassCard
        intensity={70}
        cornerRadius={0}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={[styles.headerAction, { color: colors.danger }]}>Cancelar</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.label }]} numberOfLines={1}>
              {current.name}
            </Text>
            <Text style={[styles.headerMeta, { color: colors.secondaryLabel }]}>
              {current.exercises.length} ejercicios · {totalSets} series
            </Text>
          </View>
          <Pressable onPress={onFinish} hitSlop={8} disabled={saving}>
            <Text style={[styles.headerAction, { color: colors.tint, fontWeight: '700' }]}>
              {saving ? 'Guardando…' : 'Finalizar'}
            </Text>
          </Pressable>
        </View>
      </GlassCard>

      <ScrollView
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: insets.bottom + 180 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CoachBanner suggestion={suggestion} onDismiss={clearCoach} />

        {current.exercises.map((ex) => (
          <View key={ex.exerciseId} style={styles.cardWrap}>
            <GlassCard intensity={30}>
              <View style={styles.cardInner}>
                <View style={styles.exerciseHeader}>
                  <Text style={[styles.exerciseName, { color: colors.label }]}>
                    {ex.exerciseName}
                  </Text>
                  <Pressable onPress={() => removeExercise(ex.exerciseId)} hitSlop={8}>
                    <Text style={[styles.removeX, { color: colors.tertiaryLabel }]}>Quitar</Text>
                  </Pressable>
                </View>

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
                    onToggleComplete={() => onCompleteSet(ex, s.id)}
                  />
                ))}

                <Pressable
                  onPress={() => onAddSet(ex)}
                  style={[styles.addSet, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <Text style={[styles.addSetText, { color: colors.tint }]}>+ Añadir serie</Text>
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

      {/* Floating glass action bar (rest timer sits above it when running) */}
      <View style={[styles.dock, { bottom: insets.bottom + spacing.sm }]} pointerEvents="box-none">
        {rest.running && (
          <RestTimerBar
            remaining={rest.remaining}
            total={restTotal}
            onAdd={() => rest.add(15)}
            onSkip={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              rest.stop();
            }}
          />
        )}
        <BlurView intensity={80} tint={colors.blurTint} style={styles.actionBar}>
          <PrimaryButton label="Añadir ejercicio" onPress={openSheet} />
        </BlurView>
      </View>

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
          <Text style={[styles.sheetTitle, { color: colors.label }]}>Añadir ejercicio</Text>
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
                <Text style={[styles.pickName, { color: colors.label }]}>{item.name}</Text>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  bigTitle: { ...typography.title2 },
  fallbackBtn: { alignSelf: 'stretch' },

  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  headerAction: { ...typography.body },
  headerTitle: { ...typography.headline },
  headerMeta: { ...typography.caption, marginTop: 1 },

  cardWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  cardInner: { padding: spacing.lg, gap: spacing.sm },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseName: { ...typography.headline, marginBottom: spacing.xs, flex: 1 },
  removeX: { ...typography.footnote },

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

  dock: { position: 'absolute', left: 0, right: 0 },
  actionBar: {
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.25)',
  },

  sheetHeader: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
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
