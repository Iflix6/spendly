import type { TextStyle } from 'react-native';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
}

export const lightColors: ThemeColors = {
  bg: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F6',
  border: '#E3E6EE',
  text: '#11131A',
  textMuted: '#6B7280',
  accent: '#6C5CE7',
  success: '#34C98B',
  warning: '#F5B83D',
  danger: '#FF5C5C',
};

export const darkColors: ThemeColors = {
  bg: '#0B0D12',
  surface: '#151922',
  surfaceAlt: '#1D2230',
  border: '#262C3B',
  text: '#F2F4F8',
  textMuted: '#9AA3B2',
  accent: '#6C5CE7',
  success: '#34C98B',
  warning: '#F5B83D',
  danger: '#FF5C5C',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  input: 12,
  card: 20,
  sheet: 28,
  pill: 999,
} as const;

export const layout = {
  minTouchTarget: 44,
  borderWidth: 1,
  indicatorSize: 8,
} as const;

export const opacity = {
  subtle: 0.08,
  muted: 0.65,
  tint: 0.15,
} as const;

export const letterSpacing = {
  label: 1,
  wide: 1.4,
} as const;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  display: {
    fontSize: 40,
    lineHeight: 44,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
  },
  headline: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
  },
} as const satisfies Record<string, TextStyle>;

export const tabularNums = {
  fontVariant: ['tabular-nums'],
} satisfies TextStyle;

export const lightCardShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
} satisfies TextStyle;
