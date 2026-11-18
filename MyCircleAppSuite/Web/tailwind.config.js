/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                background: {
                    DEFAULT: "rgb(var(--background))",
                    secondary: "rgb(var(--background-secondary))",
                    tertiary: "rgb(var(--background-tertiary))",
                },
                foreground: {
                    DEFAULT: "rgb(var(--foreground))",
                    secondary: "rgb(var(--foreground-secondary))",
                    muted: "rgb(var(--foreground-muted))",
                },
                primary: {
                    DEFAULT: "rgb(var(--primary))",
                    hover: "rgb(var(--primary-hover))",
                    light: "rgb(var(--primary-light))",
                    dark: "rgb(var(--primary-dark))",
                    foreground: "rgb(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "rgb(var(--secondary))",
                    hover: "rgb(var(--secondary-hover))",
                    foreground: "rgb(var(--secondary-foreground))",
                },
                accent: {
                    DEFAULT: "rgb(var(--accent))",
                    hover: "rgb(var(--accent-hover))",
                    foreground: "rgb(var(--accent-foreground))",
                },
                success: {
                    DEFAULT: "rgb(var(--success))",
                    light: "rgb(var(--success-light))",
                },
                warning: {
                    DEFAULT: "rgb(var(--warning))",
                    light: "rgb(var(--warning-light))",
                },
                error: {
                    DEFAULT: "rgb(var(--error))",
                    light: "rgb(var(--error-light))",
                },
                info: {
                    DEFAULT: "rgb(var(--info))",
                    light: "rgb(var(--info-light))",
                },
                card: {
                    DEFAULT: "rgb(var(--card))",
                    hover: "rgb(var(--card-hover))",
                    foreground: "rgb(var(--card-foreground))",
                    border: "rgb(var(--card-border))",
                    "border-hover": "rgb(var(--card-border-hover))",
                },
                input: {
                    DEFAULT: "rgb(var(--input))",
                    border: "rgb(var(--input-border))",
                    placeholder: "rgb(var(--input-placeholder))",
                },
                ring: {
                    DEFAULT: "rgb(var(--ring))",
                    offset: "rgb(var(--ring-offset))",
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
            },
            zIndex: {
                'dropdown': '10',
                'sticky': '20',
                'modal': '30',
                'toast': '40',
                'tooltip': '50',
            },
            transitionTimingFunction: {
                'bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
            boxShadow: {
                'sm': 'var(--shadow-sm)',
                'DEFAULT': 'var(--shadow)',
                'md': 'var(--shadow-md)',
                'lg': 'var(--shadow-lg)',
                'xl': 'var(--shadow-xl)',
                '2xl': 'var(--shadow-2xl)',
                'glow': '0 0 40px rgb(var(--primary) / 0.4)',
                'glow-lg': '0 0 60px rgb(var(--primary) / 0.5)',
            },
            backdropBlur: {
                'xs': '2px',
            },
            transitionDuration: {
                '400': '400ms',
                '600': '600ms',
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
        },
    },
    plugins: [],
}
