/** Profile: identity, lifetime aggregates, recent volume trend, sign-out. */
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';
import { StatPill } from '@/components/StatPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { BarChart, type BarDatum } from '@/components/BarChart';
import { usePalette, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { listWorkouts } from '@/services/workoutRepository';
import { signOut } from '@/services/authService';
import { formatVolume } from '@/utils/format';
import type { Workout } from '@/types/models';

export function ProfileScreen() {
  const { colors } = usePalette();
  const user = useAuthStore((s) => s.user);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const uid = user?.uid;
      if (!uid) return;
      listWorkouts(uid, 100)
        .then((w) => active && setWorkouts(w))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [user?.uid])
  );

  const totalVolume = workouts.reduce((n, w) => n + w.totals.volumeKg, 0);
  const totalSets = workouts.reduce((n, w) => n + w.totals.setCount, 0);
  const bestLift = workouts.reduce((m, w) => Math.max(m, w.totals.bestEstimated1RM), 0);

  // Last 8 sessions, oldest → newest, for the trend chart.
  const chartData: BarDatum[] = [...workouts]
    .slice(0, 8)
    .reverse()
    .map((w, i) => ({ label: `${i + 1}`, value: w.totals.volumeKg }));

  const displayName = user?.displayName || (user?.isAnonymous ? 'Invitado' : user?.email || 'Atleta');

  return (
    <Screen title="Perfil">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard intensity={30} style={styles.identityCard}>
          <View style={styles.identityInner}>
            <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.label }]}>{displayName}</Text>
              <Text style={[styles.sub, { color: colors.secondaryLabel }]}>
                {user?.isAnonymous ? 'Sesión de invitado' : user?.email}
              </Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.stats}>
          <StatPill label="Sesiones" value={String(workouts.length)} />
          <StatPill label="Volumen total" value={formatVolume(totalVolume)} />
        </View>
        <View style={styles.stats}>
          <StatPill label="Series totales" value={String(totalSets)} />
          <StatPill label="Mejor 1RM" value={`${bestLift} kg`} />
        </View>

        <Text style={[styles.section, { color: colors.label }]}>Volumen por sesión</Text>
        <GlassCard intensity={26} style={styles.chartCard}>
          <View style={styles.chartInner}>
            <BarChart data={chartData} />
          </View>
        </GlassCard>

        <PrimaryButton label="Cerrar sesión" variant="destructive" onPress={signOut} style={styles.signOut} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  identityCard: {},
  identityInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', ...typography.title2 },
  name: { ...typography.title3 },
  sub: { ...typography.subhead, marginTop: 2 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  section: { ...typography.title3, marginTop: spacing.lg },
  chartCard: {},
  chartInner: { padding: spacing.lg },
  signOut: { marginTop: spacing.lg },
});
