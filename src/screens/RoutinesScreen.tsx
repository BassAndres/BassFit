/** List of routine templates, with create + delete. */
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';
import { SwipeableRow } from '@/components/SwipeableRow';
import { usePalette, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { listRoutines, deleteRoutine } from '@/services/routineRepository';
import type { Routine } from '@/types/models';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RoutinesScreen() {
  const { colors } = usePalette();
  const navigation = useNavigation<Nav>();
  const uid = useAuthStore((s) => s.user?.uid);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      setRoutines(await listRoutines(uid));
    } catch {
      /* offline */
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      load().finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [load])
  );

  const removeRoutine = async (r: Routine) => {
    if (!uid) return;
    setRoutines((prev) => prev.filter((x) => x.id !== r.id));
    try {
      await deleteRoutine(uid, r.id);
    } catch {
      load();
    }
  };

  return (
    <Screen
      title="Rutinas"
      headerRight={
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('RoutineEditor', undefined);
          }}
          hitSlop={8}
          style={styles.addRow}
        >
          <Ionicons name="add-circle" size={20} color={colors.tint} />
          <Text style={[styles.add, { color: colors.tint }]}>Nueva</Text>
        </Pressable>
      }
    >
      {loading ? (
        <ActivityIndicator color={colors.tint} style={{ marginTop: spacing.xxxl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {routines.length === 0 && (
            <Text style={[styles.empty, { color: colors.secondaryLabel }]}>
              Crea tu primera rutina con el botón “＋ Nueva”.
            </Text>
          )}
          {routines.map((r) => (
            <Animated.View
              key={r.id}
              entering={FadeIn.duration(220)}
              exiting={FadeOut.duration(180)}
              layout={LinearTransition.springify().damping(18)}
            >
              <SwipeableRow onDelete={() => removeRoutine(r)}>
                <Pressable onPress={() => navigation.navigate('RoutineEditor', { routineId: r.id })}>
                  <GlassCard intensity={28} style={styles.card}>
                    <View style={styles.cardInner}>
                      <Text style={[styles.name, { color: colors.label }]}>{r.name}</Text>
                      <Text style={[styles.meta, { color: colors.secondaryLabel }]}>
                        {r.exercises.length} ejercicios ·{' '}
                        {r.exercises.reduce((n, e) => n + e.sets.length, 0)} series
                      </Text>
                    </View>
                  </GlassCard>
                </Pressable>
              </SwipeableRow>
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  add: { ...typography.body, fontWeight: '600' },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },
  empty: { ...typography.body, textAlign: 'center', marginTop: spacing.xxxl, paddingHorizontal: spacing.xl },
  card: {},
  cardInner: { padding: spacing.lg },
  name: { ...typography.headline },
  meta: { ...typography.footnote, marginTop: 2 },
  hint: { ...typography.caption, marginTop: spacing.xs },
});
