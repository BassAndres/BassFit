/**
 * A single editable set row inside an exercise card.
 * Columns: set # (+ type badge), weight, reps, RIR, and a complete toggle.
 *
 * Weight is shown/edited in the user's display unit but reported back in kg.
 * Tap the set number to cycle its type (normal → warmup → drop → failure);
 * long-press it to remove the set.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette, spacing, radius, typography } from '@/theme';
import { toDisplayWeight, fromDisplayWeight, type WeightUnit } from '@/utils/units';
import { SET_TYPE_BADGE } from '@/utils/labels';
import type { SetLog } from '@/types/models';

interface SetRowProps {
  set: SetLog;
  unit: WeightUnit;
  onChange: (patch: Partial<SetLog>) => void;
  onToggleComplete: () => void;
  onCycleType: () => void;
  onRemove: () => void;
}

export function SetRow({ set, unit, onChange, onToggleComplete, onCycleType, onRemove }: SetRowProps) {
  const { colors } = usePalette();

  const typeColor =
    set.type === 'warmup'
      ? colors.warning
      : set.type === 'dropset'
      ? colors.tint
      : set.type === 'failure'
      ? colors.danger
      : colors.secondaryLabel;

  const numeric = (
    value: number,
    key: 'weightKg' | 'achievedReps' | 'rir',
    displayValue: number
  ) => (
    <TextInput
      key={`${key}-${set.id}-${value}`}
      style={[styles.input, { color: colors.label, backgroundColor: colors.surfaceSecondary }]}
      keyboardType="decimal-pad"
      defaultValue={String(displayValue)}
      selectTextOnFocus
      onEndEditing={(e) => {
        const parsed = parseFloat(e.nativeEvent.text.replace(',', '.'));
        const safe = Number.isFinite(parsed) ? parsed : 0;
        if (key === 'weightKg') onChange({ weightKg: fromDisplayWeight(safe, unit) });
        else onChange({ [key]: safe });
      }}
      placeholderTextColor={colors.tertiaryLabel}
    />
  );

  return (
    <View style={[styles.row, set.completed && { backgroundColor: colors.success + '22' }]}>
      <Pressable onPress={onCycleType} onLongPress={onRemove} hitSlop={6} style={styles.numCell}>
        <Text style={[styles.setNo, { color: colors.secondaryLabel }]}>{set.setNumber}</Text>
        {SET_TYPE_BADGE[set.type] !== '' && (
          <Text style={[styles.badge, { color: typeColor }]}>{SET_TYPE_BADGE[set.type]}</Text>
        )}
      </Pressable>
      {numeric(set.weightKg, 'weightKg', toDisplayWeight(set.weightKg, unit))}
      {numeric(set.achievedReps, 'achievedReps', set.achievedReps)}
      {numeric(set.rir, 'rir', set.rir)}
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
        <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ opacity: set.completed ? 1 : 0 }} />
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
  numCell: { width: 24, alignItems: 'center' },
  setNo: { ...typography.subhead, fontWeight: '600' },
  badge: { ...typography.caption, fontWeight: '800', marginTop: -2 },
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
  checkMark: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
