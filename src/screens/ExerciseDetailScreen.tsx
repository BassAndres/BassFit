/**
 * Per-exercise screen: anatomical muscle map, how-to (steps), technique cues,
 * where to feel it, plus personal records, an estimated-1RM trend chart and the
 * full per-session history for this movement.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { StatPill } from '@/components/StatPill';
import { BarChart, type BarDatum } from '@/components/BarChart';
import { PrimaryButton } from '@/components/PrimaryButton';
import { MuscleMap } from '@/components/MuscleMap';
import { AnatomyModel } from '@/components/AnatomyModel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePalette, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useCatalogStore } from '@/store/catalogStore';
import { listWorkouts } from '@/services/workoutRepository';
import { computePRs, exerciseHistory, type ExerciseSessionPoint } from '@/services/personalRecords';
import { formatWeight, toDisplayWeight } from '@/utils/units';
import { formatDate, formatVolume } from '@/utils/format';
import { MUSCLE_LABEL, EQUIPMENT_LABEL } from '@/utils/labels';
import type { Exercise } from '@/types/models';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
type Rt = RouteProp<RootStackParamList, 'ExerciseDetail'>;

export function ExerciseDetailScreen() {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const uid = useAuthStore((s) => s.user?.uid);
  const unit = useSettingsStore((s) => s.unit);
  const allFn = useCatalogStore((s) => s.all);

  const exercise: Exercise | undefined = useMemo(
    () => allFn().find((e) => e.id === params.exerciseId),
    [allFn, params.exerciseId]
  );

  const [points, setPoints] = useState<ExerciseSessionPoint[]>([]);
  const [pr, setPr] = useState<{ best1RM: number; bestWeightKg: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!uid) {
      setLoading(false);
      return;
    }
    listWorkouts(uid, 300)
      .then((ws) => {
        if (!active) return;
        setPoints(exerciseHistory(ws, params.exerciseId));
        const found = computePRs(ws).get(params.exerciseId);
        setPr(found ? { best1RM: found.best1RM, bestWeightKg: found.bestWeightKg } : null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [uid, params.exerciseId]);

  const chart: BarDatum[] = points.slice(-10).map((p, i) => ({
    label: `${i + 1}`,
    value: toDisplayWeight(p.best1RM, unit),
  }));

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
    >
      <Text style={[styles.title, { color: colors.label }]}>{params.exerciseName}</Text>
      {exercise && (
        <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
          {MUSCLE_LABEL[exercise.primaryMuscle]} · {EQUIPMENT_LABEL[exercise.equipment]}
        </Text>
      )}

      {/* Muscle map */}
      {exercise && (
        <GlassCard intensity={26} style={styles.block}>
          <View style={styles.blockInner}>
            <Text style={[styles.section, { color: colors.label }]}>Músculos implicados</Text>
            <ErrorBoundary
              fallback={<MuscleMap primary={exercise.primaryMuscle} secondary={exercise.secondaryMuscles} />}
            >
              <AnatomyModel
                exerciseId={exercise.id}
                primary={exercise.primaryMuscle}
                secondary={exercise.secondaryMuscles}
              />
            </ErrorBoundary>
            <Text style={[styles.caption, { color: colors.tertiaryLabel }]}>
              Modelo 3D en la posición del ejercicio — el músculo se ilumina; gíralo con el dedo
            </Text>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: colors.tint }]} />
                <Text style={[styles.legendText, { color: colors.secondaryLabel }]}>
                  Principal: {MUSCLE_LABEL[exercise.primaryMuscle]}
                </Text>
              </View>
              {exercise.secondaryMuscles.length > 0 && (
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: colors.tint, opacity: 0.4 }]} />
                  <Text style={[styles.legendText, { color: colors.secondaryLabel }]}>
                    Secundarios: {exercise.secondaryMuscles.map((m) => MUSCLE_LABEL[m]).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </GlassCard>
      )}

      {/* How to + cues + feel */}
      {exercise?.steps && exercise.steps.length > 0 && (
        <GlassCard intensity={26} style={styles.block}>
          <View style={styles.blockInner}>
            <Text style={[styles.section, { color: colors.label }]}>Cómo hacerlo</Text>
            {exercise.steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: colors.tint }]}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.label }]}>{s}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      )}

      {exercise?.cues && exercise.cues.length > 0 && (
        <GlassCard intensity={26} style={styles.block}>
          <View style={styles.blockInner}>
            <Text style={[styles.section, { color: colors.label }]}>Técnica correcta</Text>
            {exercise.cues.map((c, i) => (
              <View key={i} style={styles.cueRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} style={styles.cueIcon} />
                <Text style={[styles.cueText, { color: colors.label }]}>{c}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      )}

      {exercise?.feelIn && (
        <GlassCard intensity={26} style={styles.block}>
          <View style={styles.feelInner}>
            <Ionicons name="flame" size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.feelTitle, { color: colors.label }]}>Dónde debes sentirlo</Text>
              <Text style={[styles.feelText, { color: colors.secondaryLabel }]}>{exercise.feelIn}</Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Progress */}
      <Text style={[styles.section, { color: colors.label, marginTop: spacing.lg }]}>Tu progreso</Text>
      {loading ? (
        <ActivityIndicator color={colors.tint} style={{ marginTop: spacing.lg }} />
      ) : points.length === 0 ? (
        <Text style={[styles.empty, { color: colors.secondaryLabel }]}>
          Aún no has registrado este ejercicio. Aparecerá aquí tras tu primera sesión.
        </Text>
      ) : (
        <>
          <View style={styles.stats}>
            <StatPill label="Mejor 1RM" value={formatWeight(pr?.best1RM ?? 0, unit)} />
            <StatPill label="Máx. peso" value={formatWeight(pr?.bestWeightKg ?? 0, unit)} />
          </View>
          <GlassCard intensity={26} style={styles.block}>
            <View style={styles.blockInner}>
              <Text style={[styles.section, { color: colors.label }]}>1RM estimado</Text>
              <BarChart data={chart} />
            </View>
          </GlassCard>
          {[...points].reverse().map((p) => (
            <View key={p.workoutId} style={[styles.histRow, { borderColor: colors.separator }]}>
              <Text style={[styles.histDate, { color: colors.label }]}>{formatDate(p.date)}</Text>
              <Text style={[styles.histMeta, { color: colors.secondaryLabel }]}>
                {formatWeight(p.topWeightKg, unit)} × {p.topReps} · {formatVolume(p.volumeKg)}
              </Text>
            </View>
          ))}
        </>
      )}

      <PrimaryButton label="Volver" variant="tinted" onPress={() => navigation.goBack()} style={styles.back} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },
  title: { ...typography.title1 },
  subtitle: { ...typography.body, marginBottom: spacing.sm, textTransform: 'capitalize' },
  block: { marginTop: spacing.xs },
  blockInner: { padding: spacing.lg, gap: spacing.sm },
  section: { ...typography.headline },
  caption: { ...typography.caption, textAlign: 'center', marginTop: spacing.xs },
  legend: { gap: spacing.xs, marginTop: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { ...typography.footnote },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { color: '#FFFFFF', ...typography.caption, fontWeight: '800' },
  stepText: { ...typography.subhead, flex: 1, lineHeight: 20 },
  cueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cueIcon: { marginTop: 1 },
  cueText: { ...typography.subhead, flex: 1, lineHeight: 20 },
  feelInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  feelTitle: { ...typography.headline },
  feelText: { ...typography.subhead, marginTop: 2 },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  empty: { ...typography.body, marginTop: spacing.sm },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  histDate: { ...typography.body, fontWeight: '600' },
  histMeta: { ...typography.footnote },
  back: { marginTop: spacing.lg },
});
