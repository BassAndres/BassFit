/**
 * Home: start an empty session, start from a routine, or jump into the most
 * recent history. Loads the user's routines and recent workouts on focus.
 */
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const uid = user?.uid;
      if (!uid) return;
      setLoading(true);
      Promise.all([listRoutines(uid), listWorkouts(uid, 60)])
        .then(([r, w]) => {
          if (!active) return;
          setRoutines(r);
          setWorkouts(w);
        })
        .catch(() => {})
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [user?.uid])
  );

  const recent = workouts.slice(0, 5);

  // Last 7 days: which were trained, and how many sessions.
  const today = new Date();
  const dayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toDateString();
    const trained = workouts.some((w) => new Date(w.startedAt).toDateString() === key);
    return { label: dayLabels[d.getDay()] ?? '', trained, isToday: i === 6 };
  });
  const sessionsThisWeek = week.filter((d) => d.trained).length;

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

        <GlassCard intensity={28} style={styles.weekCard}>
          <View style={styles.weekInner}>
            <View style={styles.weekHeader}>
              <Text style={[styles.weekTitle, { color: colors.label }]}>Esta semana</Text>
              <Text style={[styles.weekCount, { color: colors.tint }]}>
                {sessionsThisWeek} {sessionsThisWeek === 1 ? 'día' : 'días'}
              </Text>
            </View>
            <View style={styles.weekDots}>
              {week.map((d, i) => (
                <View key={i} style={styles.weekDay}>
                  <View
                    style={[
                      styles.weekDot,
                      {
                        backgroundColor: d.trained ? colors.tint : colors.surfaceSecondary,
                        borderColor: d.isToday ? colors.tint : 'transparent',
                      },
                    ]}
                  >
                    {d.trained && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.weekDayLabel, { color: colors.tertiaryLabel }]}>{d.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </GlassCard>

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
                <View style={styles.resumeCtaWrap}>
                  <Text style={[styles.resumeCta, { color: colors.tint }]}>Continuar</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.tint} />
                </View>
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
                  <Ionicons name="play-circle" size={30} color={colors.tint} />
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
              <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
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
  weekCard: {},
  weekInner: { padding: spacing.lg, gap: spacing.md },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekTitle: { ...typography.headline },
  weekCount: { ...typography.headline, fontWeight: '700' },
  weekDots: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: spacing.xs },
  weekDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  weekDayLabel: { ...typography.caption },
  resumeCard: {},
  resumeInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  resumeTitle: { ...typography.headline },
  resumeMeta: { ...typography.footnote, marginTop: 2 },
  resumeCtaWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
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
