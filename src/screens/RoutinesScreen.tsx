/** List of routine templates, with create + delete. */
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';
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

  const onDelete = (r: Routine) => {
    Alert.alert('Eliminar rutina', `¿Borrar "${r.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!uid) return;
          await deleteRoutine(uid, r.id);
          load();
        },
      },
    ]);
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
        >
          <Text style={[styles.add, { color: colors.tint }]}>＋ Nueva</Text>
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
            <Pressable
              key={r.id}
              onPress={() => navigation.navigate('RoutineEditor', { routineId: r.id })}
              onLongPress={() => onDelete(r)}
            >
              <GlassCard intensity={28} style={styles.card}>
                <View style={styles.cardInner}>
                  <Text style={[styles.name, { color: colors.label }]}>{r.name}</Text>
                  <Text style={[styles.meta, { color: colors.secondaryLabel }]}>
                    {r.exercises.length} ejercicios ·{' '}
                    {r.exercises.reduce((n, e) => n + e.sets.length, 0)} series
                  </Text>
                  <Text style={[styles.hint, { color: colors.tertiaryLabel }]}>
                    Mantén pulsado para eliminar
                  </Text>
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  add: { ...typography.body, fontWeight: '600' },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },
  empty: { ...typography.body, textAlign: 'center', marginTop: spacing.xxxl, paddingHorizontal: spacing.xl },
  card: {},
  cardInner: { padding: spacing.lg },
  name: { ...typography.headline },
  meta: { ...typography.footnote, marginTop: 2 },
  hint: { ...typography.caption, marginTop: spacing.xs },
});
