/**
 * Transient "Personal Record" celebration. Springs in, auto-dismisses.
 * Shown when a completed set beats a stored best for that exercise.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { usePalette, spacing, radius, typography } from '@/theme';

interface PRToastProps {
  message: string | null;
  onHide: () => void;
}

export function PRToast({ message, onHide }: PRToastProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!message) return;
    progress.value = withSpring(1, { damping: 16, stiffness: 200 });
    const id = setTimeout(() => {
      progress.value = withTiming(0, { duration: 220 });
      setTimeout(onHide, 240);
    }, 2400);
    return () => clearTimeout(id);
  }, [message, onHide, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -20 }, { scale: 0.95 + progress.value * 0.05 }],
  }));

  const { colors } = usePalette();
  if (!message) return null;

  return (
    <Animated.View style={[styles.wrap, style]} pointerEvents="none">
      <GlassCard intensity={70} cornerRadius={radius.lg}>
        <View style={styles.row}>
          <Text style={styles.emoji}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.label }]}>¡Récord personal!</Text>
            <Text style={[styles.msg, { color: colors.secondaryLabel }]}>{message}</Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  emoji: { fontSize: 28 },
  title: { ...typography.headline },
  msg: { ...typography.footnote, marginTop: 2 },
});
