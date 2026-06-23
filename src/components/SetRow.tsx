/**
 * A single editable set row inside an exercise card.
 * Columns: set #, weight (kg), reps, RIR, and a complete toggle.
 * Numeric fields are inline-editable; the toggle fires haptics in the parent.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePalette, spacing, radius, typography } from '@/theme';
import type { SetLog } from '@/types/models';

interface SetRowProps {
  set: SetLog;
  onChange: (patch: Partial<SetLog>) => void;
  onToggleComplete: () => void;
}

export function SetRow({ set, onChange, onToggleComplete }: SetRowProps) {
  const { colors } = usePalette();

  const cellInput = (
    value: number,
    key: 'weightKg' | 'achievedReps' | 'rir'
  ) => (
    <TextInput
      style={[styles.input, { color: colors.label, backgroundColor: colors.surfaceSecondary }]}
      keyboardType="decimal-pad"
      defaultValue={String(value)}
      selectTextOnFocus
      onEndEditing={(e) => {
        const parsed = parseFloat(e.nativeEvent.text.replace(',', '.'));
        onChange({ [key]: Number.isFinite(parsed) ? parsed : 0 });
      }}
      placeholderTextColor={colors.tertiaryLabel}
    />
  );

  return (
    <View
      style={[
        styles.row,
        set.completed && { backgroundColor: colors.success + '22' },
      ]}
    >
      <Text style={[styles.setNo, { color: colors.secondaryLabel }]}>
        {set.setNumber}
      </Text>
      {cellInput(set.weightKg, 'weightKg')}
      {cellInput(set.achievedReps, 'achievedReps')}
      {cellInput(set.rir, 'rir')}
      <Pressable
        onPress={onToggleComplete}
        style={[
          styles.check,
          {
            borderColor: set.completed ? colors.success : colors.separator,
            backgroundColor: set.completed ? colors.success : 'transparent',
          },
        ]}
        hitSlop={8}
      >
        <Text style={[styles.checkMark, { opacity: set.completed ? 1 : 0 }]}>✓</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  setNo: {
    width: 24,
    textAlign: 'center',
    ...typography.subhead,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    ...typography.body,
    fontWeight: '600',
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
