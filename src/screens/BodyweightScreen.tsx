/** Bodyweight log: add an entry, see the trend, and review past records. */
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { BarChart, type BarDatum } from '@/components/BarChart';
import { usePalette, spacing, radius, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useHaptics } from '@/hooks/useHaptics';
import { addBodyweight, listBodyweight, deleteBodyweight } from '@/services/bodyweightRepository';
import { fromDisplayWeight, toDisplayWeight, unitLabel, formatWeight } from '@/utils/units';
import { formatDate } from '@/utils/format';
import type { BodyweightEntry } from '@/types/bodyweight';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Bodyweight'>;

let bwCounter = 0;

export function BodyweightScreen() {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const haptics = useHaptics();
  const uid = useAuthStore((s) => s.user?.uid);
  const unit = useSettingsStore((s) => s.unit);

  const [entries, setEntries] = useState<BodyweightEntry[]>([]);
  const [value, setValue] = useState('');

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      setEntries(await listBodyweight(uid));
    } catch {
      /* offline */
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onAdd = async () => {
    if (!uid) return;
    const parsed = parseFloat(value.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Valor no válido', 'Introduce un peso válido.');
      return;
    }
    bwCounter += 1;
    const entry: BodyweightEntry = {
      id: `bw_${Date.now().toString(36)}_${bwCounter}`,
      weightKg: fromDisplayWeight(parsed, unit),
      recordedAt: Date.now(),
    };
    await addBodyweight(uid, entry);
    haptics.success();
    setValue('');
    load();
  };

  const onDelete = (entry: BodyweightEntry) => {
    if (!uid) return;
    Alert.alert('Eliminar registro', `${formatWeight(entry.weightKg, unit)} · ${formatDate(entry.recordedAt)}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteBodyweight(uid, entry.id);
          load();
        },
      },
    ]);
  };

  const chart: BarDatum[] = [...entries]
    .slice(0, 12)
    .reverse()
    .map((e, i) => ({ label: `${i + 1}`, value: toDisplayWeight(e.weightKg, unit) }));

  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[styles.done, { color: colors.tint }]}>Hecho</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.label }]}>Peso corporal</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <GlassCard intensity={28}>
          <View style={styles.addInner}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.label }]}
              keyboardType="decimal-pad"
              placeholder={`Peso (${unitLabel(unit)})`}
              placeholderTextColor={colors.tertiaryLabel}
              value={value}
              onChangeText={setValue}
            />
            <PrimaryButton label="Registrar" onPress={onAdd} style={styles.addBtn} />
          </View>
        </GlassCard>

        {entries.length > 0 && (
          <>
            <Text style={[styles.section, { color: colors.label }]}>Tendencia</Text>
            <GlassCard intensity={26}>
              <View style={styles.chartInner}>
                <BarChart data={chart} />
              </View>
            </GlassCard>
          </>
        )}

        <Text style={[styles.section, { color: colors.label }]}>Registros</Text>
        {entries.length === 0 ? (
          <Text style={[styles.empty, { color: colors.secondaryLabel }]}>
            Aún no has registrado tu peso corporal.
          </Text>
        ) : (
          entries.map((e) => (
            <Pressable
              key={e.id}
              onLongPress={() => onDelete(e)}
              style={[styles.row, { borderColor: colors.separator }]}
            >
              <Text style={[styles.rowWeight, { color: colors.label }]}>{formatWeight(e.weightKg, unit)}</Text>
              <Text style={[styles.rowDate, { color: colors.secondaryLabel }]}>{formatDate(e.recordedAt)}</Text>
            </Pressable>
          ))
        )}
        {entries.length > 0 && (
          <Text style={[styles.hint, { color: colors.tertiaryLabel }]}>Mantén pulsado un registro para eliminarlo</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  done: { ...typography.body, fontWeight: '600' },
  title: { ...typography.headline },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  addInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  input: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, ...typography.title3 },
  addBtn: { paddingHorizontal: spacing.xl },
  section: { ...typography.title3, marginTop: spacing.sm },
  chartInner: { padding: spacing.lg },
  empty: { ...typography.body },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowWeight: { ...typography.body, fontWeight: '700' },
  rowDate: { ...typography.footnote },
  hint: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
});
