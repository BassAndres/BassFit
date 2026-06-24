/**
 * iOS-style swipe-to-delete row. Swipe left to reveal a red "Eliminar" action,
 * mirroring the native UITableView delete gesture. Wraps any row content.
 */
import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { usePalette, spacing, typography } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  label?: string;
}

export function SwipeableRow({ children, onDelete, label = 'Eliminar' }: SwipeableRowProps) {
  const { colors } = usePalette();
  const haptics = useHaptics();
  const ref = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <RectButton
      style={[styles.action, { backgroundColor: colors.danger }]}
      onPress={() => {
        haptics.warning();
        ref.current?.close();
        onDelete();
      }}
    >
      <View style={styles.actionInner}>
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        <Text style={styles.actionText}>{label}</Text>
      </View>
    </RectButton>
  );

  return (
    <Swipeable
      ref={ref}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  action: { justifyContent: 'center', alignItems: 'flex-end' },
  actionInner: { alignItems: 'center', justifyContent: 'center', width: 88, gap: 2 },
  actionText: { color: '#FFFFFF', ...typography.caption, fontWeight: '700' },
});
