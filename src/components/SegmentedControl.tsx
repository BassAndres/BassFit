/** iOS-style segmented control. Generic over the option value. */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePalette, spacing, radius, typography } from '@/theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors } = usePalette();
  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segment,
              selected && { backgroundColor: colors.surface, borderColor: colors.separator },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.label : colors.secondaryLabel, fontWeight: selected ? '600' : '400' },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.sm,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  label: { ...typography.subhead },
});
