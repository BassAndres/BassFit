/**
 * FASE 5 — LiveWorkoutTracker.
 *
 * The core "in-session" screen. Pulls together every pillar of the brief plus
 * the advanced feature set:
 *  - Glassmorphism (expo-blur), bottom sheets with real physics, SF type,
 *    iOS radii, and haptics on every logged set.
 *  - Coach Inteligente (useProgressiveOverload) after each completed set.
 *  - Live elapsed timer, rest countdown, kg/lb units, set-type cycling,
 *    warm-up generation, plate calculator, exercise reorder + notes.
 *  - Personal-record detection with a celebratory toast.
 *  - Persistence: the active session is auto-saved (resume) and written to
 *    Firestore on finish.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';

import { usePalette, spacing, radius, typography } from '@/theme';
import { GlassCard } from '@/components/GlassCard';
import { CoachBanner } from '@/components/CoachBanner';
import { SetRow } from '@/components/SetRow';
import { RestTimerBar } from '@/components/RestTimerBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PRToast } from '@/components/PRToast';
import { ExercisePickerSheet, type ExercisePickerSheetRef } from '@/components/ExercisePickerSheet';
import { PlateCalculatorSheet, type PlateCalculatorSheetRef } from '@/components/PlateCalculatorSheet';

import { useWorkoutStore } from '@/store/workoutStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useProgressiveOverload } from '@/hooks/useProgressiveOverload';
import { useRestTimer } from '@/hooks/useRestTimer';
import { useElapsed } from '@/hooks/useElapsed';
import { useHaptics } from '@/hooks/useHaptics';
import { saveWorkout, listWorkouts } from '@/services/workoutRepository';
import { computePRs, type ExercisePR } from '@/services/personalRecords';
import { formatVolume, formatClock } from '@/utils/format';
import { unitLabel, formatWeight } from '@/utils/units';
import type { RootStackParamList } from '@/navigation/types';
import type { Exercise, WorkoutExercise } from '@/types/models';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LiveWorkout'>;

export function LiveWorkoutTracker() {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const haptics = useHaptics();

  const uid = useAuthStore((s) => s.user?.uid);
  const unit = useSettingsStore((s) => s.unit);
  const autoStartRest = useSettingsStore((s) => s.autoStartRest);

  const current = useWorkoutStore((s) => s.current);
  const lastCompletedSet = useWorkoutStore((s) => s.lastCompletedSet);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const renameWorkout = useWorkoutStore((s) => s.renameWorkout);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const addSet = useWorkoutStore((s) => s.addSet);
  const addWarmupSets = useWorkoutStore((s) => s.addWarmupSets);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const cycleSetType = useWorkoutStore((s) => s.cycleSetType);
  const completeSet = useWorkoutStore((s) => s.completeSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const moveExercise = useWorkoutStore((s) => s.moveExercise);
  const setExerciseNote = useWorkoutStore((s) => s.setExerciseNote);
  const clearCoach = useWorkoutStore((s) => s.clearCoach);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);

  const suggestion = useProgressiveOverload(lastCompletedSet);
  const elapsed = useElapsed(current?.startedAt);

  const [restTotal, setRestTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [prMessage, setPrMessage] = useState<string | null>(null);
  const prsRef = useRef<Map<string, ExercisePR>>(new Map());

  const rest = useRestTimer(() => haptics.success());

  const pickerRef = useRef<ExercisePickerSheetRef>(null);
  const plateRef = useRef<PlateCalculatorSheetRef>(null);

  // Load PR baselines once so we can detect new records mid-session.
  useEffect(() => {
    if (!uid) return;
    let active = true;
    listWorkouts(uid, 200)
      .then((ws) => {
        if (active) prsRef.current = computePRs(ws);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [uid]);

  const onPickExercise = useCallback(
    (exercise: Exercise) => {
      addExercise(exercise);
    },
    [addExercise]
  );

  const onAddSet = useCallback(
    (ex: WorkoutExercise) => {
      haptics.light();
      const last = ex.sets[ex.sets.length - 1];
      addSet(ex.exerciseId, {
        weightKg: last?.weightKg ?? 20,
        targetReps: last?.targetReps ?? 10,
        achievedReps: last?.targetReps ?? 10,
        rir: last?.rir ?? 2,
      });
    },
    [addSet, haptics]
  );

  const onWarmup = useCallback(
    (ex: WorkoutExercise) => {
      const top = ex.sets.reduce((m, s) => Math.max(m, s.weightKg), 0);
      if (top <= 0) {
        Alert.alert('Calentamiento', 'Añade primero una serie de trabajo con peso.');
        return;
      }
      haptics.medium();
      addWarmupSets(ex.exerciseId, top);
    },
    [addWarmupSets, haptics]
  );

  const onCompleteSet = useCallback(
    (ex: WorkoutExercise, setId: string) => {
      const completed = completeSet(ex.exerciseId, setId);
      if (!completed) {
        haptics.light();
        return;
      }
      haptics.success();
      if (autoStartRest && ex.restSeconds > 0) {
        setRestTotal(ex.restSeconds);
        rest.start(ex.restSeconds);
      }
      // Personal-record check (working sets only).
      if (completed.type !== 'warmup') {
        const pr = prsRef.current.get(ex.exerciseId);
        if (!pr || completed.estimated1RM > pr.best1RM) {
          setPrMessage(`${ex.exerciseName}: 1RM est. ${formatWeight(completed.estimated1RM, unit)}`);
          haptics.heavy();
        } else if (completed.weightKg > pr.bestWeightKg) {
          setPrMessage(`${ex.exerciseName}: nuevo máximo ${formatWeight(completed.weightKg, unit)}`);
          haptics.heavy();
        }
        prsRef.current.set(ex.exerciseId, {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          best1RM: Math.max(pr?.best1RM ?? 0, completed.estimated1RM),
          bestWeightKg: Math.max(pr?.bestWeightKg ?? 0, completed.weightKg),
          bestSetVolumeKg: Math.max(pr?.bestSetVolumeKg ?? 0, completed.weightKg * completed.achievedReps),
        });
      }
    },
    [completeSet, autoStartRest, rest, haptics, unit]
  );

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
        onPress: async () => {
          const workout = finishWorkout(uid);
          if (!workout) return;
          setSaving(true);
          rest.stop();
          try {
            await saveWorkout(workout);
            haptics.success();
            Alert.alert(
              '¡Sesión guardada! 🎉',
              `Volumen: ${formatVolume(workout.totals.volumeKg)}\n` +
                `Series: ${workout.totals.setCount}\n` +
                `Mejor 1RM est.: ${formatWeight(workout.totals.bestEstimated1RM, unit)}`
            );
          } catch {
            Alert.alert('Guardado local', 'No se pudo subir a Firestore. La sesión se cerró igualmente.');
          } finally {
            setSaving(false);
            navigation.goBack();
          }
        },
      },
    ]);
  }, [current, uid, finishWorkout, navigation, rest, haptics, unit]);

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

  const totalSets = useMemo(
    () => (current ? current.exercises.reduce((n, e) => n + e.sets.length, 0) : 0),
    [current]
  );

  if (!current) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.bigTitle, { color: colors.label }]}>Sin sesión activa</Text>
        <PrimaryButton
          label="Empezar entrenamiento vacío"
          onPress={() => {
            haptics.medium();
            startWorkout('Sesión de hoy');
          }}
          style={styles.fallbackBtn}
        />
        <PrimaryButton label="Volver" variant="tinted" onPress={() => navigation.goBack()} style={styles.fallbackBtn} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <GlassCard intensity={70} cornerRadius={0} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={[styles.headerAction, { color: colors.danger }]}>Cancelar</Text>
          </Pressable>
          <TextInput
            value={current.name}
            onChangeText={renameWorkout}
            style={[styles.nameInput, { color: colors.label }]}
            textAlign="center"
          />
          <Pressable onPress={onFinish} hitSlop={8} disabled={saving}>
            <Text style={[styles.headerAction, { color: colors.tint, fontWeight: '700' }]}>
              {saving ? 'Guardando…' : 'Finalizar'}
            </Text>
          </Pressable>
        </View>
        <Text style={[styles.headerMeta, { color: colors.secondaryLabel }]}>
          {formatClock(elapsed)} · {current.exercises.length} ejercicios · {totalSets} series
        </Text>
      </GlassCard>

      <ScrollView
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: insets.bottom + 190 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PRToast message={prMessage} onHide={() => setPrMessage(null)} />
        <CoachBanner suggestion={suggestion} onDismiss={clearCoach} />

        {current.exercises.map((ex, index) => (
          <View key={ex.exerciseId} style={styles.cardWrap}>
            <GlassCard intensity={30}>
              <View style={styles.cardInner}>
                <View style={styles.exerciseHeader}>
                  <Text style={[styles.exerciseName, { color: colors.label }]}>{ex.exerciseName}</Text>
                  <View style={styles.exerciseTools}>
                    <Pressable onPress={() => moveExercise(ex.exerciseId, 'up')} disabled={index === 0} hitSlop={6}>
                      <Text style={[styles.tool, { color: index === 0 ? colors.tertiaryLabel : colors.tint }]}>▲</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => moveExercise(ex.exerciseId, 'down')}
                      disabled={index === current.exercises.length - 1}
                      hitSlop={6}
                    >
                      <Text
                        style={[
                          styles.tool,
                          { color: index === current.exercises.length - 1 ? colors.tertiaryLabel : colors.tint },
                        ]}
                      >
                        ▼
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => removeExercise(ex.exerciseId)} hitSlop={6}>
                      <Text style={[styles.removeX, { color: colors.danger }]}>Quitar</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.columnsHeader}>
                  <Text style={[styles.colLabel, { color: colors.tertiaryLabel, width: 24 }]}>#</Text>
                  <Text style={[styles.colLabel, { color: colors.tertiaryLabel }]}>{unitLabel(unit).toUpperCase()}</Text>
                  <Text style={[styles.colLabel, { color: colors.tertiaryLabel }]}>REPS</Text>
                  <Text style={[styles.colLabel, { color: colors.tertiaryLabel }]}>RIR</Text>
                  <Text style={[styles.colLabel, { color: colors.tertiaryLabel, width: 32 }]} />
                </View>

                {ex.sets.map((s) => (
                  <SetRow
                    key={s.id}
                    set={s}
                    unit={unit}
                    onChange={(patch) => updateSet(ex.exerciseId, s.id, patch)}
                    onToggleComplete={() => onCompleteSet(ex, s.id)}
                    onCycleType={() => {
                      haptics.selection();
                      cycleSetType(ex.exerciseId, s.id);
                    }}
                    onRemove={() => removeSet(ex.exerciseId, s.id)}
                  />
                ))}

                <View style={styles.exerciseActions}>
                  <Pressable onPress={() => onAddSet(ex)} style={[styles.actionChip, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.actionChipText, { color: colors.tint }]}>+ Serie</Text>
                  </Pressable>
                  <Pressable onPress={() => onWarmup(ex)} style={[styles.actionChip, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.actionChipText, { color: colors.warning }]}>Calent.</Text>
                  </Pressable>
                </View>

                <TextInput
                  value={ex.note ?? ''}
                  onChangeText={(t) => setExerciseNote(ex.exerciseId, t)}
                  placeholder="Nota…"
                  placeholderTextColor={colors.tertiaryLabel}
                  style={[styles.note, { color: colors.secondaryLabel }]}
                />
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

      <View style={[styles.dock, { bottom: insets.bottom + spacing.sm }]} pointerEvents="box-none">
        {rest.running && (
          <RestTimerBar
            remaining={rest.remaining}
            total={restTotal}
            onAdd={() => rest.add(15)}
            onSkip={() => {
              haptics.light();
              rest.stop();
            }}
          />
        )}
        <BlurView intensity={80} tint={colors.blurTint} style={styles.actionBar}>
          <Pressable
            onPress={() => {
              haptics.light();
              plateRef.current?.present();
            }}
            style={[styles.plateBtn, { borderColor: colors.separator }]}
          >
            <Text style={styles.plateEmoji}>🏋️</Text>
          </Pressable>
          <PrimaryButton
            label="Añadir ejercicio"
            onPress={() => {
              haptics.medium();
              pickerRef.current?.present();
            }}
            style={styles.addExerciseBtn}
          />
        </BlurView>
      </View>

      <ExercisePickerSheet ref={pickerRef} onPick={onPickExercise} />
      <PlateCalculatorSheet ref={plateRef} />
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
  headerAction: { ...typography.body },
  nameInput: { flex: 1, marginHorizontal: spacing.sm, ...typography.headline },
  headerMeta: { ...typography.caption, marginTop: spacing.xs, textAlign: 'center' },

  cardWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  cardInner: { padding: spacing.lg, gap: spacing.sm },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseName: { ...typography.headline, flex: 1 },
  exerciseTools: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tool: { fontSize: 16 },
  removeX: { ...typography.footnote },

  columnsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, gap: spacing.sm },
  colLabel: { flex: 1, textAlign: 'center', ...typography.caption, fontWeight: '700', letterSpacing: 0.5 },

  exerciseActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionChip: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  actionChipText: { ...typography.callout, fontWeight: '600' },
  note: { ...typography.footnote, paddingTop: spacing.xs },

  hint: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing.xxl, marginTop: spacing.xxl },

  dock: { position: 'absolute', left: 0, right: 0 },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.25)',
  },
  plateBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  plateEmoji: { fontSize: 22 },
  addExerciseBtn: { flex: 1 },
});
