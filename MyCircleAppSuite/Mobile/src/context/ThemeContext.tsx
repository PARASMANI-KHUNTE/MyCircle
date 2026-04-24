import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { appThemes, themeTokens, ThemeMode, AppColors, AppTheme } from '../theme/theme';

type ThemeContextColors = AppColors & {
    input: string;
    neon: string;
};

type ThemeContextType = {
    theme: ThemeMode;
    colors: ThemeContextColors;
    appTheme: AppTheme;
    isDark: boolean;
    tokens: typeof themeTokens;
    typography: AppTheme['typography'];
    spacing: AppTheme['spacing'];
    radius: AppTheme['radius'];
    shadow: AppTheme['shadow'];
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');

    useEffect(() => {
        void loadTheme();
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

    const setTheme = async (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('app_theme', newTheme);
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const toggleTheme = () => {
        void setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const appTheme = appThemes[theme];
    const colors: ThemeContextColors = {
        ...appTheme.colors,
        input: appTheme.colors.elevated,
        neon: appTheme.colors.primary,
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                colors,
                appTheme,
                isDark: appTheme.isDark,
                tokens: themeTokens,
                typography: appTheme.typography,
                spacing: appTheme.spacing,
                radius: appTheme.radius,
                shadow: appTheme.shadow,
                toggleTheme,
                setTheme,
            }}
        >
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
