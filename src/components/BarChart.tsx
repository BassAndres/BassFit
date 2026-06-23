/**
 * Minimal dependency-free bar chart (pure Views). Used for per-session volume
 * trends on the Profile screen. Heights are normalized to the max value.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePalette, spacing, radius, typography } from '@/theme';

export interface BarDatum {
  label: string;
  value: number;
}

export function BarChart({ data, height = 140 }: { data: BarDatum[]; height?: number }) {
  const { colors } = usePalette();
  const max = data.reduce((m, d) => Math.max(m, d.value), 0) || 1;

  if (data.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.secondaryLabel }]}>
        Aún no hay datos suficientes.
      </Text>
    );
  }

  return (
    <View style={[styles.chart, { height }]}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * (height - 24));
        return (
          <View key={`${d.label}-${i}`} style={styles.col}>
            <View style={[styles.bar, { height: h, backgroundColor: colors.tint }]} />
            <Text style={[styles.barLabel, { color: colors.tertiaryLabel }]} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '70%', borderRadius: radius.sm, minHeight: 4 },
  barLabel: { ...typography.caption, marginTop: spacing.xs },
  empty: { ...typography.body, textAlign: 'center', paddingVertical: spacing.xl },
});
