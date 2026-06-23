/** Preferences: units, theme, default rest, auto-rest, haptics, bar weight. */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { usePalette, spacing, radius, typography } from '@/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { formatClock } from '@/utils/format';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsScreen() {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const s = useSettingsStore();

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
  footer: { ...typography.footnote, textAlign: 'center', marginTop: spacing.lg },
});
