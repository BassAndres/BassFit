/** History feed: all saved workouts, newest first. */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '@/components/Screen';
import { usePalette, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { listWorkouts } from '@/services/workoutRepository';
import { formatDate, formatDuration, formatVolume } from '@/utils/format';
import type { Workout } from '@/types/models';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const { colors } = usePalette();
  const navigation = useNavigation<Nav>();
  const uid = useAuthStore((s) => s.user?.uid);

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      setWorkouts(await listWorkouts(uid, 100));
    } catch {
      /* offline / not configured */
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Screen title="Historial">
        <ActivityIndicator color={colors.tint} style={{ marginTop: spacing.xxxl }} />
      </Screen>
    );
  }

  return (
    <Screen title="Historial">
      <FlatList
        data={workouts}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.secondaryLabel }]}>
            Tus entrenamientos guardados aparecerán aquí.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id })}
            style={[styles.row, { borderColor: colors.separator }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.label }]}>{item.name}</Text>
              <Text style={[styles.meta, { color: colors.secondaryLabel }]}>
                {formatDate(item.startedAt)} · {item.exercises.length} ejercicios ·{' '}
                {formatDuration(item.totals.durationSeconds)}
              </Text>
            </View>
            <View style={styles.volCol}>
              <Text style={[styles.vol, { color: colors.label }]}>
                {formatVolume(item.totals.volumeKg)}
              </Text>
              <Text style={[styles.volLabel, { color: colors.tertiaryLabel }]}>volumen</Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  empty: { ...typography.body, textAlign: 'center', marginTop: spacing.xxxl, paddingHorizontal: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: { ...typography.headline },
  meta: { ...typography.footnote, marginTop: 2 },
  volCol: { alignItems: 'flex-end' },
  vol: { ...typography.body, fontWeight: '700' },
  volLabel: { ...typography.caption },
});
