/**
 * Create / edit a routine template. Add movements via the shared exercise
 * picker, tune sets / target reps / RIR / rest per exercise, then save to
 * Firestore. Sets within an exercise share the same target for simplicity.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ExercisePickerSheet, type ExercisePickerSheetRef } from '@/components/ExercisePickerSheet';
import { usePalette, spacing, radius, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useHaptics } from '@/hooks/useHaptics';
import { listRoutines, upsertRoutine } from '@/services/routineRepository';
import type { Exercise, Routine, RoutineExercise, RoutineSet } from '@/types/models';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RoutineEditor'>;
type Rt = RouteProp<RootStackParamList, 'RoutineEditor'>;

interface DraftExercise {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: Exercise['primaryMuscle'];
  restSeconds: number;
  setCount: number;
  targetReps: number;
  targetRir: number;
}

let localIdCounter = 0;
function newId(): string {
  localIdCounter += 1;
  return `rt_${Date.now().toString(36)}_${localIdCounter}`;
}

export function RoutineEditorScreen() {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const haptics = useHaptics();
  const uid = useAuthStore((s) => s.user?.uid);
  const editingId = route.params?.routineId;

  const [name, setName] = useState('');
  const [items, setItems] = useState<DraftExercise[]>([]);
  const [createdAt, setCreatedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const pickerRef = useRef<ExercisePickerSheetRef>(null);

  useEffect(() => {
    let active = true;
    if (!uid || !editingId) return;
    listRoutines(uid).then((rs) => {
      const r = rs.find((x) => x.id === editingId);
      if (!active || !r) return;
      setName(r.name);
      setCreatedAt(r.createdAt);
      setItems(
        r.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          primaryMuscle: e.primaryMuscle,
          restSeconds: e.restSeconds,
          setCount: e.sets.length || 1,
          targetReps: e.sets[0]?.targetReps ?? 10,
          targetRir: e.sets[0]?.targetRir ?? 2,
        }))
      );
    });
    return () => {
      active = false;
    };
  }, [uid, editingId]);

  const addExercise = (ex: Exercise) => {
    setItems((prev) =>
      prev.some((p) => p.exerciseId === ex.id)
        ? prev
        : [
            ...prev,
            {
              exerciseId: ex.id,
              exerciseName: ex.name,
              primaryMuscle: ex.primaryMuscle,
              restSeconds: 120,
              setCount: 3,
              targetReps: 10,
              targetRir: 2,
            },
          ]
    );
  };

  const patch = (id: string, p: Partial<DraftExercise>) =>
    setItems((prev) => prev.map((it) => (it.exerciseId === id ? { ...it, ...p } : it)));
  const remove = (id: string) => setItems((prev) => prev.filter((it) => it.exerciseId !== id));

  const onSave = async () => {
    if (!uid || !name.trim()) return;
    setSaving(true);
    const now = Date.now();
    const exercises: RoutineExercise[] = items.map((it) => {
      const sets: RoutineSet[] = Array.from({ length: Math.max(1, it.setCount) }, (_, i) => ({
        setNumber: i + 1,
        type: 'normal',
        targetReps: it.targetReps,
        targetRir: it.targetRir,
      }));
      return {
        exerciseId: it.exerciseId,
        exerciseName: it.exerciseName,
        primaryMuscle: it.primaryMuscle,
        restSeconds: it.restSeconds,
        sets,
      };
    });
    const routine: Routine = {
      id: editingId ?? newId(),
      ownerUid: uid,
      name: name.trim(),
      exercises,
      createdAt: createdAt ?? now,
      updatedAt: now,
    };
    try {
      await upsertRoutine(routine);
      haptics.success();
    } catch {
      /* offline cache still applies */
    } finally {
      setSaving(false);
      navigation.goBack();
    }
  };

  const stepper = (value: number, onDec: () => void, onInc: () => void) => (
    <View style={styles.stepper}>
      <Pressable onPress={onDec} style={[styles.stepBtn, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.stepText, { color: colors.tint }]}>−</Text>
      </Pressable>
      <Text style={[styles.stepValue, { color: colors.label }]}>{value}</Text>
      <Pressable onPress={onInc} style={[styles.stepBtn, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.stepText, { color: colors.tint }]}>＋</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[styles.topAction, { color: colors.danger }]}>Cancelar</Text>
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.label }]}>
          {editingId ? 'Editar rutina' : 'Nueva rutina'}
        </Text>
        <Pressable onPress={onSave} hitSlop={8} disabled={saving || !name.trim()}>
          <Text style={[styles.topAction, { color: name.trim() ? colors.tint : colors.tertiaryLabel, fontWeight: '700' }]}>
            Guardar
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={[styles.nameInput, { backgroundColor: colors.surface, color: colors.label, borderColor: colors.separator }]}
          placeholder="Nombre de la rutina (ej. Push A)"
          placeholderTextColor={colors.tertiaryLabel}
          value={name}
          onChangeText={setName}
        />

        {items.map((it) => (
          <GlassCard key={it.exerciseId} intensity={28}>
            <View style={styles.cardInner}>
              <View style={styles.exHeader}>
                <Text style={[styles.exName, { color: colors.label }]}>{it.exerciseName}</Text>
                <Pressable onPress={() => remove(it.exerciseId)} hitSlop={8}>
                  <Text style={[styles.remove, { color: colors.danger }]}>Quitar</Text>
                </Pressable>
              </View>

              <Row label="Series">
                {stepper(
                  it.setCount,
                  () => patch(it.exerciseId, { setCount: Math.max(1, it.setCount - 1) }),
                  () => patch(it.exerciseId, { setCount: it.setCount + 1 })
                )}
              </Row>
              <Row label="Reps objetivo">
                {stepper(
                  it.targetReps,
                  () => patch(it.exerciseId, { targetReps: Math.max(1, it.targetReps - 1) }),
                  () => patch(it.exerciseId, { targetReps: it.targetReps + 1 })
                )}
              </Row>
              <Row label="RIR objetivo">
                {stepper(
                  it.targetRir,
                  () => patch(it.exerciseId, { targetRir: Math.max(0, it.targetRir - 1) }),
                  () => patch(it.exerciseId, { targetRir: it.targetRir + 1 })
                )}
              </Row>
              <Row label="Descanso (s)">
                {stepper(
                  it.restSeconds,
                  () => patch(it.exerciseId, { restSeconds: Math.max(30, it.restSeconds - 15) }),
                  () => patch(it.exerciseId, { restSeconds: it.restSeconds + 15 })
                )}
              </Row>
            </View>
          </GlassCard>
        ))}

        <PrimaryButton
          label="＋ Añadir ejercicio"
          variant="tinted"
          onPress={() => {
            haptics.light();
            pickerRef.current?.present();
          }}
          style={styles.addBtn}
        />
      </ScrollView>

      <ExercisePickerSheet ref={pickerRef} onPick={addExercise} />
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = usePalette();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.secondaryLabel }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topAction: { ...typography.body },
  topTitle: { ...typography.headline },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  nameInput: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    ...typography.body,
  },
  cardInner: { padding: spacing.lg, gap: spacing.sm },
  exHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exName: { ...typography.headline, flex: 1 },
  remove: { ...typography.footnote, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { ...typography.body },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20, fontWeight: '600' },
  stepValue: { ...typography.headline, minWidth: 36, textAlign: 'center' },
  addBtn: { marginTop: spacing.sm },
});
