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
                    section: "rgb(var(--background-section))",
                },
                foreground: "rgb(var(--foreground))",
                primary: {
                    DEFAULT: "rgb(var(--primary))",
                    hover: "rgb(var(--primary-hover))",
                    foreground: "rgb(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "rgb(var(--secondary))",
                    foreground: "rgb(var(--secondary-foreground))",
                    hover: "rgb(var(--secondary-hover))",
                },
                text: {
                    heading: "rgb(var(--text-heading))",
                    body: "rgb(var(--text-body))",
                    muted: "rgb(var(--text-muted))",
                    lightMuted: "rgb(var(--text-light-muted))",
                },
                "muted-foreground": "rgb(var(--text-muted))",
                card: {
                    DEFAULT: "rgb(var(--card))",
                    foreground: "rgb(var(--card-foreground))",
                    border: "rgb(var(--card-border-rgb))",
                },
                hover: {
                    bg: "rgb(var(--hover-bg))",
                }
            },
            fontFamily: {
                sans: ['Inter', 'Poppins', 'sans-serif'],
                display: ['Poppins', 'Inter', 'sans-serif'],
            },
            borderRadius: {
                'button': '12px',
                'card': '16px',
            },
            boxShadow: {
                'card': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
                'button': '0 4px 14px 0 rgba(245, 158, 11, 0.25)',
                'glass-panel': '0 32px 64px -16px rgba(0, 0, 0, 0.08)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
