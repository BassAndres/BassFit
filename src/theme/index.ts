/**
 * BassFit Design System.
 *
 * Mirrors Apple's Human Interface Guidelines: system colors that adapt to
 * light/dark mode, the 8pt spacing grid, and SF-style typography (the system
 * font is San Francisco on iOS by default, so we never declare a fontFamily).
 */
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

export type ColorScheme = 'light' | 'dark';

export interface Palette {
  /** App background (grouped style, like Settings.app). */
  background: string;
  /** Elevated surface / card. */
  surface: string;
  /** Secondary elevated surface. */
  surfaceSecondary: string;
  /** Primary text. */
  label: string;
  /** Secondary / muted text. */
  secondaryLabel: string;
  /** Tertiary text. */
  tertiaryLabel: string;
  /** Hairline separators. */
  separator: string;
  /** System blue (primary tint / actions). */
  tint: string;
  /** Positive / success (e.g. progressive overload "go heavier"). */
  success: string;
  /** Warning (e.g. "hold weight"). */
  warning: string;
  /** Destructive (e.g. "deload"). */
  danger: string;
  /** Fill behind blur for glass cards. */
  glassFill: string;
  /** Tint for the BlurView. */
  blurTint: 'light' | 'dark' | 'default';
}

const lightPalette: Palette = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceSecondary: '#FFFFFF',
  label: '#000000',
  secondaryLabel: 'rgba(60, 60, 67, 0.6)',
  tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
  separator: 'rgba(60, 60, 67, 0.29)',
  tint: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  glassFill: 'rgba(255, 255, 255, 0.6)',
  blurTint: 'light',
};

const darkPalette: Palette = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceSecondary: '#2C2C2E',
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
  separator: 'rgba(84, 84, 88, 0.65)',
  tint: '#0A84FF',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  glassFill: 'rgba(28, 28, 30, 0.6)',
  blurTint: 'dark',
};

export const palettes: Record<ColorScheme, Palette> = {
  light: lightPalette,
  dark: darkPalette,
};

/** 8pt spacing grid. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** iOS-characteristic corner radii. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Type scale aligned with iOS text styles. */
export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.37 },
  title1: { fontSize: 28, fontWeight: '700' as const },
  title2: { fontSize: 22, fontWeight: '700' as const },
  title3: { fontSize: 20, fontWeight: '600' as const },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  callout: { fontSize: 16, fontWeight: '400' as const },
  subhead: { fontSize: 15, fontWeight: '400' as const },
  footnote: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
} as const;

/**
 * Resolve the active palette. Honors the user's theme preference
 * ('system' | 'light' | 'dark'); falls back to the OS appearance.
 */
export function usePalette(): { scheme: ColorScheme; colors: Palette } {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const preference = useSettingsStore((s) => s.theme);
  const accent = useSettingsStore((s) => s.accent);
  const scheme: ColorScheme = preference === 'system' ? system : preference;
  const base = palettes[scheme];
  const colors = accent && accent !== base.tint ? { ...base, tint: accent } : base;
  return { scheme, colors };
}
