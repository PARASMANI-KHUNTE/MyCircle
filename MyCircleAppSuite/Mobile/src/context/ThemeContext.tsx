import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Palette } from '../constants/design';

// Define Color Palette
export const Colors = {
    dark: {
        background: Palette.dark.bg,
        card: Palette.dark.surface,
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        border: Palette.dark.elevator,
        input: Palette.dark.elevator,
        placeholder: '#64748b',

        primary: Palette.violet[500],
        secondary: Palette.cyan[500],
        accent: Palette.pink[500],

        danger: Palette.error,
        success: Palette.success,
        warning: Palette.warning,

        // Custom additions
        glass: Palette.dark.glass,
        neon: Palette.violet.neon,
    },
    light: {
        background: Palette.light.bg,
        card: Palette.light.surface,
        text: '#0f172a',
        textSecondary: '#64748b',
        border: Palette.light.elevator,
        input: Palette.light.elevator,
        placeholder: '#94a3b8',

        primary: Palette.violet[600],
        secondary: Palette.cyan[500],
        accent: Palette.pink[500],

        danger: Palette.error,
        success: Palette.success,
        warning: Palette.warning,

        // Custom additions
        glass: Palette.light.glass,
        neon: Palette.violet[500],
    }
};

type ThemeContextType = {
    theme: 'dark' | 'light';
    colors: typeof Colors.dark;
    toggleTheme: () => void;
    setTheme: (theme: 'dark' | 'light') => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<'dark' | 'light'>(systemScheme === 'dark' ? 'dark' : 'light');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('app_theme');
            if (savedTheme === 'dark' || savedTheme === 'light') {
                setThemeState(savedTheme);
            }
        } catch (error) {
            console.error('Failed to load theme', error);
        }
    };

    const setTheme = async (newTheme: 'dark' | 'light') => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('app_theme', newTheme);
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const colors = Colors[theme];

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
