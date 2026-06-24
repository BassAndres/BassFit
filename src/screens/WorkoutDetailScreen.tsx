/** Read-only detail of a saved workout, with per-set breakdown. */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { StatPill } from '@/components/StatPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { usePalette, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { getWorkout, deleteWorkout } from '@/services/workoutRepository';
import { formatDate, formatDuration, formatVolume } from '@/utils/format';
import { formatWeight } from '@/utils/units';
import type { Workout } from '@/types/models';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'WorkoutDetail'>;
type Rt = RouteProp<RootStackParamList, 'WorkoutDetail'>;

export function WorkoutDetailScreen() {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const uid = useAuthStore((s) => s.user?.uid);
  const unit = useSettingsStore((s) => s.unit);
  const startFromWorkout = useWorkoutStore((s) => s.startFromWorkout);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!uid) return;
    getWorkout(uid, params.workoutId)
      .then((w) => active && setWorkout(w))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [uid, params.workoutId]);

  const onDelete = async () => {
    if (!uid) return;
    await deleteWorkout(uid, params.workoutId);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.label }]}>No encontrado</Text>
        <PrimaryButton label="Volver" variant="tinted" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
    >
      <Text style={[styles.title, { color: colors.label }]}>{workout.name}</Text>
      <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
        {formatDate(workout.startedAt)}
      </Text>

      <View style={styles.stats}>
        <StatPill label="Volumen" value={formatVolume(workout.totals.volumeKg)} />
        <StatPill label="Series" value={String(workout.totals.setCount)} />
        <StatPill label="Duración" value={formatDuration(workout.totals.durationSeconds)} />
        <StatPill label="Mejor 1RM" value={formatWeight(workout.totals.bestEstimated1RM, unit)} />
      </View>

      {workout.exercises.map((ex) => (
        <GlassCard key={ex.exerciseId} intensity={28} style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={[styles.exName, { color: colors.label }]}>{ex.exerciseName}</Text>
            {ex.sets.map((s) => (
              <View key={s.id} style={styles.setRow}>
                <Text style={[styles.setNo, { color: colors.secondaryLabel }]}>{s.setNumber}</Text>
                <Text style={[styles.setVal, { color: colors.label }]}>
                  {formatWeight(s.weightKg, unit)} × {s.achievedReps}
                </Text>
                <Text style={[styles.setMeta, { color: colors.tertiaryLabel }]}>
                  RIR {s.rir} · 1RM {formatWeight(s.estimated1RM, unit)}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>
      ))}

      <PrimaryButton
        label="Repetir entrenamiento"
        onPress={() => {
          startFromWorkout(workout);
          navigation.navigate('LiveWorkout');
        }}
        style={styles.repeat}
      />
      <PrimaryButton label="Eliminar entrenamiento" variant="destructive" onPress={onDelete} style={styles.delete} />
      <PrimaryButton label="Volver" variant="tinted" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },
  title: { ...typography.title1 },
  subtitle: { ...typography.body, marginBottom: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  card: { marginBottom: spacing.sm },
  cardInner: { padding: spacing.lg, gap: spacing.xs },
  exName: { ...typography.headline, marginBottom: spacing.xs },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  setNo: { width: 20, ...typography.subhead, fontWeight: '600' },
  setVal: { ...typography.body, fontWeight: '600', minWidth: 110 },
  setMeta: { ...typography.footnote, flex: 1 },
  repeat: { marginTop: spacing.lg },
  delete: { marginTop: spacing.sm },
});
