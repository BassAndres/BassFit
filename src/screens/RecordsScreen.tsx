/** All personal records across exercises, ranked by estimated 1RM. */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { usePalette, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { listWorkouts } from '@/services/workoutRepository';
import { computePRs, type ExercisePR } from '@/services/personalRecords';
import { formatWeight } from '@/utils/units';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Records'>;

export function RecordsScreen() {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const uid = useAuthStore((s) => s.user?.uid);
  const unit = useSettingsStore((s) => s.unit);

  const [prs, setPrs] = useState<ExercisePR[]>([]);
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
        const list = Array.from(computePRs(ws).values()).sort((a, b) => b.best1RM - a.best1RM);
        setPrs(list);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [uid]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.tint} />
          <Text style={[styles.back, { color: colors.tint }]}>Atrás</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.label }]}>Récords</Text>
        <View style={{ width: 64 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.tint} style={{ marginTop: spacing.xxxl }} />
      ) : prs.length === 0 ? (
        <Text style={[styles.empty, { color: colors.secondaryLabel }]}>
          Aún no tienes récords. Completa entrenamientos para registrarlos.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {prs.map((pr) => (
            <Pressable
              key={pr.exerciseId}
              onPress={() =>
                navigation.navigate('ExerciseDetail', { exerciseId: pr.exerciseId, exerciseName: pr.exerciseName })
              }
            >
              <GlassCard intensity={26} style={styles.card}>
                <View style={styles.cardInner}>
                  <View style={[styles.medal, { backgroundColor: colors.warning }]}>
                    <Ionicons name="trophy" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.label }]}>{pr.exerciseName}</Text>
                    <Text style={[styles.meta, { color: colors.secondaryLabel }]}>
                      Máx: {formatWeight(pr.bestWeightKg, unit)}
                    </Text>
                  </View>
                  <View style={styles.oneRmCol}>
                    <Text style={[styles.oneRm, { color: colors.tint }]}>{formatWeight(pr.best1RM, unit)}</Text>
                    <Text style={[styles.oneRmLabel, { color: colors.tertiaryLabel }]}>1RM est.</Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 64 },
  back: { ...typography.body },
  title: { ...typography.headline },
  empty: { ...typography.body, textAlign: 'center', marginTop: spacing.xxxl, paddingHorizontal: spacing.xl },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },
  card: {},
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  medal: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.headline },
  meta: { ...typography.footnote, marginTop: 2 },
  oneRmCol: { alignItems: 'flex-end' },
  oneRm: { ...typography.headline, fontWeight: '700' },
  oneRmLabel: { ...typography.caption },
});
