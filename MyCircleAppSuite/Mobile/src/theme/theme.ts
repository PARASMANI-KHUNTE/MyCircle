import {
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationDefaultTheme,
    Theme as NavigationTheme,
} from '@react-navigation/native';

export type ThemeMode = 'light' | 'dark';

const palette = {
    violet: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
        neon: '#a855f7',
    },
    cyan: {
        400: '#22d3ee',
        500: '#06b6d4',
    },
    pink: {
        400: '#f472b6',
        500: '#ec4899',
    },
    slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        400: '#94a3b8',
        500: '#64748b',
        700: '#334155',
        900: '#0f172a',
        950: '#020617',
    },
    zinc: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        400: '#a1a1aa',
        500: '#71717a',
        800: '#27272a',
        900: '#18181b',
        950: '#09090b',
    },
    semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
    },
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
} as const;

const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
} as const;

const radius = {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    pill: 999,
} as const;

const typography = {
    fontFamily: {
        regular: 'System',
        medium: 'System',
        semibold: 'System',
        bold: 'System',
    },
    size: {
        caption: 12,
        bodySmall: 14,
        body: 16,
        title: 20,
        heading: 24,
        display: 32,
        hero: 42,
    },
    lineHeight: {
        caption: 18,
        bodySmall: 20,
        body: 24,
        title: 28,
        heading: 32,
        display: 40,
        hero: 48,
    },
    weight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
} as const;

const shadow = {
    sm: {
        shadowColor: palette.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: palette.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },
    lg: {
        shadowColor: palette.black,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 10,
    },
} as const;

export type AppColors = {
    background: string;
    backgroundMuted: string;
    surface: string;
    card: string;
    elevated: string;
    border: string;
    borderStrong: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    placeholder: string;
    primary: string;
    primaryStrong: string;
    primarySoft: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    overlay: string;
    glass: string;
    backdrop: string;
    gradientStart: string;
    gradientMiddle: string;
    gradientEnd: string;
    cardSoft: string;
    borderSoft: string;
    successSoft: string;
    warningSoft: string;
    dangerSoft: string;
    white: string;
    black: string;
};

export type AppTheme = {
    mode: ThemeMode;
    isDark: boolean;
    colors: AppColors;
    spacing: typeof spacing;
    radius: typeof radius;
    typography: typeof typography;
    shadow: typeof shadow;
};

const commonThemeValues = {
    spacing,
    radius,
    typography,
    shadow,
};

export const appThemes: Record<ThemeMode, AppTheme> = {
    dark: {
        mode: 'dark',
        isDark: true,
        colors: {
            background: palette.zinc[950],
            backgroundMuted: palette.slate[950],
            surface: palette.zinc[900],
            card: palette.zinc[900],
            elevated: palette.zinc[800],
            border: 'rgba(255,255,255,0.10)',
            borderStrong: 'rgba(255,255,255,0.18)',
            text: '#f8fafc',
            textSecondary: palette.slate[400],
            textMuted: palette.slate[500],
            placeholder: palette.slate[500],
            primary: palette.violet.neon,
            primaryStrong: palette.violet[500],
            primarySoft: 'rgba(168,85,247,0.16)',
            secondary: palette.cyan[500],
            accent: palette.pink[500],
            success: palette.semantic.success,
            warning: palette.semantic.warning,
            danger: palette.semantic.danger,
            info: palette.semantic.info,
            overlay: 'rgba(2,6,23,0.72)',
            glass: 'rgba(9,9,11,0.72)',
            backdrop: 'rgba(255,255,255,0.05)',
            gradientStart: '#0a0a0a',
            gradientMiddle: '#1a1a2e',
            gradientEnd: '#16213e',
            cardSoft: 'rgba(255,255,255,0.05)',
            borderSoft: 'rgba(255,255,255,0.10)',
            successSoft: 'rgba(16,185,129,0.12)',
            warningSoft: 'rgba(245,158,11,0.12)',
            dangerSoft: 'rgba(239,68,68,0.12)',
            white: palette.white,
            black: palette.black,
        },
        ...commonThemeValues,
    },
    light: {
        mode: 'light',
        isDark: false,
        colors: {
            background: palette.white,
            backgroundMuted: palette.slate[50],
            surface: palette.slate[50],
            card: palette.white,
            elevated: palette.slate[100],
            border: palette.slate[200],
            borderStrong: '#cbd5e1',
            text: palette.slate[900],
            textSecondary: palette.slate[500],
            textMuted: palette.slate[400],
            placeholder: palette.slate[400],
            primary: palette.violet[600],
            primaryStrong: palette.violet[700],
            primarySoft: 'rgba(124,58,237,0.12)',
            secondary: palette.cyan[500],
            accent: palette.pink[500],
            success: palette.semantic.success,
            warning: palette.semantic.warning,
            danger: palette.semantic.danger,
            info: palette.semantic.info,
            overlay: 'rgba(15,23,42,0.16)',
            glass: 'rgba(255,255,255,0.72)',
            backdrop: 'rgba(15,23,42,0.04)',
            gradientStart: '#ffffff',
            gradientMiddle: '#f8fafc',
            gradientEnd: '#eef2ff',
            cardSoft: 'rgba(255,255,255,0.92)',
            borderSoft: '#e2e8f0',
            successSoft: 'rgba(16,185,129,0.10)',
            warningSoft: 'rgba(245,158,11,0.10)',
            dangerSoft: 'rgba(239,68,68,0.10)',
            white: palette.white,
            black: palette.black,
        },
        ...commonThemeValues,
    },
};

export const getNavigationTheme = (theme: AppTheme): NavigationTheme => {
    const baseTheme = theme.isDark ? NavigationDarkTheme : NavigationDefaultTheme;

    return {
        ...baseTheme,
        dark: theme.isDark,
        colors: {
            ...baseTheme.colors,
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.card,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.accent,
        },
    };
};

export const themeTokens = {
    palette,
    spacing,
    radius,
    typography,
    shadow,
};
