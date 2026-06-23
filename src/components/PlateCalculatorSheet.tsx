/**
 * Plate calculator bottom sheet. Given a target load and the bar weight, shows
 * the plates to load per side (greedy from heaviest). Metric plate set.
 */
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePalette, spacing, radius, typography } from '@/theme';
import { useSettingsStore } from '@/store/settingsStore';

export interface PlateCalculatorSheetRef {
  present: (targetKg?: number) => void;
}

const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

/** Greedy per-side plate breakdown for a target total load. */
function platesPerSide(targetKg: number, barKg: number): { plate: number; count: number }[] {
  let perSide = Math.max(0, (targetKg - barKg) / 2);
  const out: { plate: number; count: number }[] = [];
  for (const plate of PLATES_KG) {
    const count = Math.floor(perSide / plate + 1e-6);
    if (count > 0) {
      out.push({ plate, count });
      perSide -= count * plate;
    }
  }
  return out;
}

export const PlateCalculatorSheet = forwardRef<PlateCalculatorSheetRef, object>((_props, ref) => {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();
  const barKg = useSettingsStore((s) => s.barWeightKg);

  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['50%'], []);
  const [target, setTarget] = useState('60');

  useImperativeHandle(ref, () => ({
    present: (targetKg) => {
      if (typeof targetKg === 'number' && targetKg > 0) setTarget(String(targetKg));
      sheetRef.current?.present();
    },
  }));

  const targetKg = parseFloat(target.replace(',', '.')) || 0;
  const breakdown = platesPerSide(targetKg, barKg);
  const remainder = targetKg - barKg - breakdown.reduce((n, p) => n + p.plate * p.count * 2, 0);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
      )}
      handleIndicatorStyle={{ backgroundColor: colors.tertiaryLabel }}
      backgroundStyle={{ backgroundColor: colors.surface }}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={[styles.title, { color: colors.label }]}>Calculadora de discos</Text>
        <Text style={[styles.sub, { color: colors.secondaryLabel }]}>Barra: {barKg} kg</Text>

        <View style={styles.inputRow}>
          <Text style={[styles.inputLabel, { color: colors.secondaryLabel }]}>Peso objetivo (kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.label }]}
            keyboardType="decimal-pad"
            value={target}
            onChangeText={setTarget}
            selectTextOnFocus
          />
        </View>

        <Text style={[styles.perSide, { color: colors.label }]}>Por lado:</Text>
        <View style={styles.plates}>
          {breakdown.length === 0 ? (
            <Text style={[styles.empty, { color: colors.secondaryLabel }]}>
              Solo la barra ({barKg} kg).
            </Text>
          ) : (
            breakdown.map((p) => (
              <View key={p.plate} style={[styles.plateChip, { backgroundColor: colors.tint }]}>
                <Text style={styles.plateText}>
                  {p.count} × {p.plate}
                </Text>
              </View>
            ))
          )}
        </View>
        {remainder > 0.01 && (
          <Text style={[styles.warn, { color: colors.warning }]}>
            No exacto: faltan {Math.round(remainder * 100) / 100} kg con discos estándar.
          </Text>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

PlateCalculatorSheet.displayName = 'PlateCalculatorSheet';

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  title: { ...typography.title3 },
  sub: { ...typography.subhead },
  inputRow: { marginTop: spacing.md, gap: spacing.xs },
  inputLabel: { ...typography.footnote },
  input: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    ...typography.title3,
  },
  perSide: { ...typography.headline, marginTop: spacing.md },
  plates: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  plateChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  plateText: { color: '#FFFFFF', ...typography.headline },
  empty: { ...typography.body },
  warn: { ...typography.footnote, marginTop: spacing.xs },
});
