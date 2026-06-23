/** A labelled metric chip used in summaries and the profile screen. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePalette, spacing, radius, typography } from '@/theme';

export function StatPill({ label, value }: { label: string; value: string }) {
  const { colors } = usePalette();
  return (
    <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
      <Text style={[styles.value, { color: colors.label }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.secondaryLabel }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  value: { ...typography.title3 },
  label: { ...typography.caption, marginTop: 2, textAlign: 'center' },
});
