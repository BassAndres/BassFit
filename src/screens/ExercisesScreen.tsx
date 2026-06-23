/** Browse the exercise catalog (seed + custom), search and filter by muscle. */
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, FlatList } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '@/components/Screen';
import { usePalette, spacing, radius, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useCatalogStore } from '@/store/catalogStore';
import { MUSCLE_LABEL, EQUIPMENT_LABEL, ALL_MUSCLES } from '@/utils/labels';
import type { Exercise, MuscleGroup } from '@/types/models';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ExercisesScreen() {
  const { colors } = usePalette();
  const navigation = useNavigation<Nav>();
  const uid = useAuthStore((s) => s.user?.uid);
  const load = useCatalogStore((s) => s.load);
  const custom = useCatalogStore((s) => s.custom);
  const allFn = useCatalogStore((s) => s.all);

  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      if (uid) load(uid);
    }, [uid, load])
  );

  const list = useMemo(() => {
    void custom;
    const q = search.trim().toLowerCase();
    return allFn().filter((e) => {
      const matchesQ = !q || e.name.toLowerCase().includes(q);
      const matchesMuscle = muscle === 'all' || e.primaryMuscle === muscle;
      return matchesQ && matchesMuscle;
    });
  }, [allFn, custom, search, muscle]);

  const muscleOptions: Array<MuscleGroup | 'all'> = ['all', ...ALL_MUSCLES];

  return (
    <Screen title="Ejercicios">
      <View style={styles.controls}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.label }]}
          placeholder="Buscar…"
          placeholderTextColor={colors.tertiaryLabel}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {muscleOptions.map((m) => {
            const active = muscle === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMuscle(m)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? colors.tint : colors.surface, borderColor: active ? colors.tint : colors.separator },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.secondaryLabel }]}>
                  {m === 'all' ? 'Todos' : MUSCLE_LABEL[m]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: colors.separator }]} />}
        renderItem={({ item }: { item: Exercise }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate('ExerciseDetail', { exerciseId: item.id, exerciseName: item.name })
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.label }]}>
                {item.name}
                {item.isCustom ? '  ·  propio' : ''}
              </Text>
              <Text style={[styles.meta, { color: colors.secondaryLabel }]}>
                {MUSCLE_LABEL[item.primaryMuscle]} · {EQUIPMENT_LABEL[item.equipment]}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.tertiaryLabel }]}>›</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  input: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, ...typography.body },
  chips: { gap: spacing.xs, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: spacing.xs,
  },
  chipText: { ...typography.footnote, fontWeight: '600' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
  sep: { height: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  name: { ...typography.body, fontWeight: '600' },
  meta: { ...typography.footnote, marginTop: 2 },
  chevron: { fontSize: 22 },
});
