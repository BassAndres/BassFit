/**
 * Per-exercise progress: personal records, an estimated-1RM trend chart, and
 * the full per-session history for this movement.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { StatPill } from '@/components/StatPill';
import { BarChart, type BarDatum } from '@/components/BarChart';
import { PrimaryButton } from '@/components/PrimaryButton';
import { usePalette, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { listWorkouts } from '@/services/workoutRepository';
import { computePRs, exerciseHistory, type ExerciseSessionPoint } from '@/services/personalRecords';
import { formatWeight, toDisplayWeight } from '@/utils/units';
import { formatDate, formatVolume } from '@/utils/format';
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

  const [points, setPoints] = useState<ExerciseSessionPoint[]>([]);
  const [pr, setPr] = useState<{ best1RM: number; bestWeightKg: number; bestSetVolumeKg: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!uid) return;
    listWorkouts(uid, 300)
      .then((ws) => {
        if (!active) return;
        setPoints(exerciseHistory(ws, params.exerciseId));
        const prMap = computePRs(ws);
        const found = prMap.get(params.exerciseId);
        setPr(found ? { best1RM: found.best1RM, bestWeightKg: found.bestWeightKg, bestSetVolumeKg: found.bestSetVolumeKg } : null);
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

      {loading ? (
        <ActivityIndicator color={colors.tint} style={{ marginTop: spacing.xl }} />
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

          <Text style={[styles.section, { color: colors.label }]}>1RM estimado (últimas sesiones)</Text>
          <GlassCard intensity={26}>
            <View style={styles.chartInner}>
              <BarChart data={chart} />
            </View>
          </GlassCard>

          <Text style={[styles.section, { color: colors.label }]}>Historial</Text>
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
  title: { ...typography.title1, marginBottom: spacing.sm },
  empty: { ...typography.body, marginTop: spacing.lg },
  stats: { flexDirection: 'row', gap: spacing.sm },
  section: { ...typography.title3, marginTop: spacing.lg },
  chartInner: { padding: spacing.lg },
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
