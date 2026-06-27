/** Preferences: units, theme, default rest, auto-rest, haptics, bar weight. */
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { GlassCard } from '@/components/GlassCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { usePalette, spacing, radius, typography } from '@/theme';
import { useSettingsStore, ACCENT_PRESETS } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { listWorkouts } from '@/services/workoutRepository';
import { formatClock } from '@/utils/format';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsScreen() {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const s = useSettingsStore();
  const uid = useAuthStore((st) => st.user?.uid);
  const [exporting, setExporting] = useState(false);

  const csvCell = (v: unknown) => {
    const str = String(v ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const onExport = async () => {
    if (!uid) return;
    setExporting(true);
    try {
      const ws = await listWorkouts(uid, 1000);
      let csv = 'fecha,entrenamiento,ejercicio,serie,tipo,peso_kg,reps,rir,rpe,1rm_kg\n';
      for (const w of ws) {
        const date = new Date(w.startedAt).toISOString();
        for (const ex of w.exercises) {
          for (const set of ex.sets) {
            csv +=
              [date, w.name, ex.exerciseName, set.setNumber, set.type, set.weightKg, set.achievedReps, set.rir, set.rpe ?? '', set.estimated1RM]
                .map(csvCell)
                .join(',') + '\n';
          }
        }
      }
      const uri = `${FileSystem.cacheDirectory}bassfit-historial.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Exportar historial' });
      } else {
        Alert.alert('Exportado', `Archivo guardado en:\n${uri}`);
      }
    } catch {
      Alert.alert('Error', 'No se pudo exportar el historial.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[styles.done, { color: colors.tint }]}>Hecho</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.label }]}>Ajustes</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard intensity={28}>
          <View style={styles.cardInner}>
            <Field label="Unidad de peso">
              <SegmentedControl
                options={[
                  { value: 'kg', label: 'kg' },
                  { value: 'lb', label: 'lb' },
                ]}
                value={s.unit}
                onChange={s.setUnit}
              />
            </Field>

            <Divider />

            <Field label="Tema">
              <SegmentedControl
                options={[
                  { value: 'system', label: 'Sistema' },
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Oscuro' },
                ]}
                value={s.theme}
                onChange={s.setTheme}
              />
            </Field>

            <Divider />

            <Field label="Color de acento">
              <View style={styles.swatches}>
                {ACCENT_PRESETS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => s.setAccent(c)}
                    style={[
                      styles.swatch,
                      { backgroundColor: c, borderColor: s.accent === c ? colors.label : 'transparent' },
                    ]}
                  >
                    {s.accent === c && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  </Pressable>
                ))}
              </View>
            </Field>
          </View>
        </GlassCard>

        <GlassCard intensity={28} style={styles.card}>
          <View style={styles.cardInner}>
            <RowToggle
              label="Iniciar descanso automáticamente"
              value={s.autoStartRest}
              onValueChange={s.setAutoStartRest}
            />
            <Divider />
            <RowStepper
              label="Descanso por defecto"
              value={formatClock(s.defaultRestSeconds)}
              onDec={() => s.setDefaultRest(Math.max(15, s.defaultRestSeconds - 15))}
              onInc={() => s.setDefaultRest(s.defaultRestSeconds + 15)}
            />
            <Divider />
            <RowToggle label="Haptics" value={s.haptics} onValueChange={s.setHaptics} />
            <Divider />
            <RowStepper
              label="Peso de la barra (kg)"
              value={`${s.barWeightKg} kg`}
              onDec={() => s.setBarWeight(Math.max(5, s.barWeightKg - 2.5))}
              onInc={() => s.setBarWeight(s.barWeightKg + 2.5)}
            />
          </View>
        </GlassCard>

        <GlassCard intensity={28} style={styles.card}>
          <Pressable onPress={onExport} disabled={exporting} style={styles.exportRow}>
            <Ionicons name="download-outline" size={22} color={colors.tint} />
            <Text style={[styles.exportText, { color: colors.label }]}>
              {exporting ? 'Exportando…' : 'Exportar historial (CSV)'}
            </Text>
          </Pressable>
        </GlassCard>

        <Text style={[styles.footer, { color: colors.tertiaryLabel }]}>BassFit · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = usePalette();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.label }]}>{label}</Text>
      {children}
    </View>
  );
}

function RowToggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const { colors } = usePalette();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.label }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.tint }} />
    </View>
  );
}

function RowStepper({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  const { colors } = usePalette();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.label }]}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable onPress={onDec} style={[styles.stepBtn, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.stepText, { color: colors.tint }]}>−</Text>
        </Pressable>
        <Text style={[styles.stepValue, { color: colors.label }]}>{value}</Text>
        <Pressable onPress={onInc} style={[styles.stepBtn, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.stepText, { color: colors.tint }]}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Divider() {
  const { colors } = usePalette();
  return <View style={[styles.divider, { backgroundColor: colors.separator }]} />;
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
  card: {},
  cardInner: { padding: spacing.lg, gap: spacing.md },
  field: { gap: spacing.sm },
  fieldLabel: { ...typography.headline },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { ...typography.body, flex: 1 },
  divider: { height: StyleSheet.hairlineWidth },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20, fontWeight: '600' },
  stepValue: { ...typography.body, fontWeight: '600', minWidth: 64, textAlign: 'center' },
  swatches: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  swatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  exportRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  exportText: { ...typography.body, fontWeight: '600' },
  footer: { ...typography.footnote, textAlign: 'center', marginTop: spacing.lg },
});
