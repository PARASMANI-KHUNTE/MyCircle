import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define Color Palette
// ... (Colors object remains unchanged, so I will target the lines around imports and load/save logic)

// Skipping Colors object in replacement for brevity if possible, but replace_file_content needs contiguous block. 
// I will target specific blocks.

// Actually, I can just replace the whole file content or specific functions. 
// Let's replace the import and the functions.

// Define Color Palette
// Define Color Palette
export const Colors = {
    dark: {
        background: '#09090b', // Zinc-950 (Slightly reduced contrast from pure black)
        card: '#18181b', // Zinc-900
        text: '#f4f4f5', // Zinc-100
        textSecondary: '#a1a1aa', // Zinc-400
        border: '#27272a', // Zinc-800
        primary: '#8b5cf6', // Violet-500
        danger: '#ef4444',
        success: '#22c55e',
        input: '#27272a', // Zinc-800
        placeholder: '#71717a',
    },
    light: {
        background: '#f8fafc', // Slate-50 (Very light cool grey)
        card: '#ffffff', // White
        text: '#0f172a', // Slate-900
        textSecondary: '#64748b', // Slate-500
        border: '#e2e8f0', // Slate-200
        primary: '#7c3aed', // Violet-600
        danger: '#dc2626',
        success: '#16a34a',
        input: '#f1f5f9', // Slate-100
        placeholder: '#94a3b8',
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
