/** Profile: identity, lifetime aggregates, trends, muscle split, links. */
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';
import { StatPill } from '@/components/StatPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { BarChart, type BarDatum } from '@/components/BarChart';
import { usePalette, spacing, radius, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { listWorkouts } from '@/services/workoutRepository';
import { volumeByMuscle } from '@/services/personalRecords';
import { signOut } from '@/services/authService';
import { formatVolume } from '@/utils/format';
import { formatWeight, toDisplayWeight } from '@/utils/units';
import { MUSCLE_LABEL } from '@/utils/labels';
import type { Workout, MuscleGroup } from '@/types/models';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const { colors } = usePalette();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const unit = useSettingsStore((s) => s.unit);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const uid = user?.uid;
      if (!uid) return;
      listWorkouts(uid, 200)
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

  const volumeChart: BarDatum[] = [...workouts]
    .slice(0, 8)
    .reverse()
    .map((w, i) => ({ label: `${i + 1}`, value: toDisplayWeight(w.totals.volumeKg, unit) }));

  const muscleMap = volumeByMuscle(workouts);
  const muscleChart: BarDatum[] = (Object.keys(muscleMap) as MuscleGroup[])
    .map((m) => ({ label: MUSCLE_LABEL[m].slice(0, 4), value: muscleMap[m] ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const displayName = user?.displayName || (user?.isAnonymous ? 'Invitado' : user?.email || 'Atleta');

  return (
    <Screen
      title="Perfil"
      headerRight={
        <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={8}>
          <Ionicons name="settings-outline" size={24} color={colors.tint} />
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard intensity={30}>
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
          <StatPill label="Mejor 1RM" value={formatWeight(bestLift, unit)} />
        </View>

        <Text style={[styles.section, { color: colors.label }]}>Volumen por sesión</Text>
        <GlassCard intensity={26}>
          <View style={styles.chartInner}>
            <BarChart data={volumeChart} />
          </View>
        </GlassCard>

        <Text style={[styles.section, { color: colors.label }]}>Volumen por músculo</Text>
        <GlassCard intensity={26}>
          <View style={styles.chartInner}>
            <BarChart data={muscleChart} />
          </View>
        </GlassCard>

        <Pressable onPress={() => navigation.navigate('Records')}>
          <GlassCard intensity={28} style={styles.linkCard}>
            <View style={styles.linkInner}>
              <Ionicons name="trophy-outline" size={22} color={colors.tint} />
              <Text style={[styles.linkText, { color: colors.label }]}>Récords personales</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
            </View>
          </GlassCard>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Bodyweight')}>
          <GlassCard intensity={28} style={styles.linkCard}>
            <View style={styles.linkInner}>
              <Ionicons name="body-outline" size={22} color={colors.tint} />
              <Text style={[styles.linkText, { color: colors.label }]}>Peso corporal</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
            </View>
          </GlassCard>
        </Pressable>

        <PrimaryButton label="Cerrar sesión" variant="destructive" onPress={signOut} style={styles.signOut} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  identityInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', ...typography.title2 },
  name: { ...typography.title3 },
  sub: { ...typography.subhead, marginTop: 2 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  section: { ...typography.title3, marginTop: spacing.lg },
  chartInner: { padding: spacing.lg },
  linkCard: { marginTop: spacing.sm },
  linkInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  linkText: { ...typography.body, fontWeight: '600', flex: 1 },
  chevron: { fontSize: 22 },
  signOut: { marginTop: spacing.lg },
});
