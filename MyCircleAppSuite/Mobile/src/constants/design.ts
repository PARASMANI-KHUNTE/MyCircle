export const Palette = {
    // Core Brand (Vibrant Circle)
    violet: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6', // Main Primary
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
        neon: '#a855f7', // Punchy Neon Violet
    },
    cyan: {
        400: '#22d3ee',
        500: '#06b6d4', // Secondary
        neon: '#0891b2',
    },
    pink: {
        400: '#f472b6',
        500: '#ec4899', // Accent
        neon: '#f9a8d4',
    },

    // Backgrounds & Surfaces
    dark: {
        bg: '#09090b',     // Deepest Black/Zinc
        surface: '#18181b', // Cards
        elevator: '#27272a', // Modals/Popovers
        glass: 'rgba(9, 9, 11, 0.7)', // Dark Glass
    },
    light: {
        bg: '#ffffff',
        surface: '#f8fafc',
        elevator: '#e2e8f0',
        glass: 'rgba(255, 255, 255, 0.7)', // Light Glass
    },

    // Semantic
    success: '#10b981', // Emerald
    warning: '#f59e0b', // Amber
    error: '#ef4444',   // Red
    info: '#3b82f6',    // Blue
}

export const Gradients = {
    // Linear Gradients [Start, End]
    primary: ['#a855f7', '#8b5cf6'], // Neon Violet -> Violet
    secondary: ['#22d3ee', '#3b82f6'], // Cyan -> Blue
    accent: ['#f472b6', '#ec4899'], // Pink -> Magenta
    fire: ['#f59e0b', '#ef4444'], // Amber -> Red

    // Glassmorphism overlays
    glass: {
        light: 'rgba(255, 255, 255, 0.2)',
        medium: 'rgba(255, 255, 255, 0.4)',
        heavy: 'rgba(255, 255, 255, 0.6)',
        border: 'rgba(255, 255, 255, 0.2)',
    }
}

export const Layout = {
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        full: 9999,
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    }
}
