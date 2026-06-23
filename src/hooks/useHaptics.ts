/**
 * Centralized haptics that respect the user's setting. Components call these
 * instead of expo-haptics directly, so a single toggle disables all feedback.
 */
import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/store/settingsStore';

export function useHaptics() {
  const enabled = useSettingsStore((s) => s.haptics);

  const light = useCallback(() => {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [enabled]);

  const medium = useCallback(() => {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [enabled]);

  const heavy = useCallback(() => {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [enabled]);

  const selection = useCallback(() => {
    if (enabled) Haptics.selectionAsync();
  }, [enabled]);

  const success = useCallback(() => {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [enabled]);

  const warning = useCallback(() => {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [enabled]);

  const error = useCallback(() => {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [enabled]);

  return { light, medium, heavy, selection, success, warning, error };
}
