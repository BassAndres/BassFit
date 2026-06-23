/**
 * Home: start an empty session, start from a routine, or jump into the most
 * recent history. Loads the user's routines and recent workouts on focus.
 */
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { usePalette, spacing, radius, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { listRoutines } from '@/services/routineRepository';
import { listWorkouts } from '@/services/workoutRepository';
import { formatDate, formatVolume } from '@/utils/format';
import type { Routine, Workout } from '@/types/models';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const { colors } = usePalette();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const active = useWorkoutStore((s) => s.current);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const startFromRoutine = useWorkoutStore((s) => s.startFromRoutine);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [recent, setRecent] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const uid = user?.uid;
      if (!uid) return;
      setLoading(true);
      Promise.all([listRoutines(uid), listWorkouts(uid, 5)])
        .then(([r, w]) => {
          if (!active) return;
          setRoutines(r);
          setRecent(w);
        })
        .catch(() => {})
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [user?.uid])
  );

  const beginEmpty = () => {
    const launch = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startWorkout('Sesión de hoy');
      navigation.navigate('LiveWorkout');
    };
    if (active) {
      Alert.alert('Sesión en curso', 'Ya tienes un entrenamiento activo. ¿Descartarlo y empezar uno nuevo?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Empezar nuevo', style: 'destructive', onPress: launch },
      ]);
      return;
    }
    launch();
  };

  const beginRoutine = (routine: Routine) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startFromRoutine(routine);
    navigation.navigate('LiveWorkout');
  };

  const greeting = user?.displayName ? `Hola, ${user.displayName}` : 'Listo para entrenar';

  return (
    <Screen title="Inicio">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.greeting, { color: colors.secondaryLabel }]}>{greeting}</Text>

        {active && (
          <Pressable onPress={() => navigation.navigate('LiveWorkout')}>
            <GlassCard intensity={32} style={styles.resumeCard}>
              <View style={styles.resumeInner}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resumeTitle, { color: colors.label }]}>Entrenamiento en curso</Text>
                  <Text style={[styles.resumeMeta, { color: colors.secondaryLabel }]} numberOfLines={1}>
                    {active.name} · {active.exercises.length} ejercicios
                  </Text>
                </View>
                <Text style={[styles.resumeCta, { color: colors.tint }]}>Continuar ›</Text>
              </View>
            </GlassCard>
          </Pressable>
        )}

        <PrimaryButton label="Empezar entrenamiento vacío" onPress={beginEmpty} />

        <Text style={[styles.section, { color: colors.label }]}>Tus rutinas</Text>
        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginVertical: spacing.lg }} />
        ) : routines.length === 0 ? (
          <Text style={[styles.muted, { color: colors.secondaryLabel }]}>
            Crea una rutina en la pestaña Rutinas para empezar más rápido.
          </Text>
        ) : (
          routines.map((r) => (
            <Pressable key={r.id} onPress={() => beginRoutine(r)}>
              <GlassCard intensity={28} style={styles.routineCard}>
                <View style={styles.routineInner}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.routineName, { color: colors.label }]}>{r.name}</Text>
                    <Text style={[styles.routineMeta, { color: colors.secondaryLabel }]} numberOfLines={1}>
                      {r.exercises.map((e) => e.exerciseName).join(' · ') || 'Sin ejercicios'}
                    </Text>
                  </View>
                  <Text style={[styles.play, { color: colors.tint }]}>▶</Text>
                </View>
              </GlassCard>
            </Pressable>
          ))
        )}

        <Text style={[styles.section, { color: colors.label }]}>Reciente</Text>
        {recent.length === 0 ? (
          <Text style={[styles.muted, { color: colors.secondaryLabel }]}>
            Aún no has registrado entrenamientos.
          </Text>
        ) : (
          recent.map((w) => (
            <Pressable
              key={w.id}
              onPress={() => navigation.navigate('WorkoutDetail', { workoutId: w.id })}
              style={[styles.recentRow, { borderColor: colors.separator }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.recentName, { color: colors.label }]}>{w.name}</Text>
                <Text style={[styles.recentMeta, { color: colors.secondaryLabel }]}>
                  {formatDate(w.startedAt)} · {formatVolume(w.totals.volumeKg)}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: colors.tertiaryLabel }]}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  greeting: { ...typography.body },
  resumeCard: {},
  resumeInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  resumeTitle: { ...typography.headline },
  resumeMeta: { ...typography.footnote, marginTop: 2 },
  resumeCta: { ...typography.body, fontWeight: '600' },
  section: { ...typography.title3, marginTop: spacing.lg },
  muted: { ...typography.subhead },
  routineCard: { marginBottom: spacing.xs },
  routineInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  routineName: { ...typography.headline },
  routineMeta: { ...typography.footnote, marginTop: 2 },
  play: { fontSize: 18 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recentName: { ...typography.body, fontWeight: '600' },
  recentMeta: { ...typography.footnote, marginTop: 2 },
  chevron: { fontSize: 22 },
});
