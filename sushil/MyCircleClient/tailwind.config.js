/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#ffffff", // White background for fresh look
                foreground: "#0f172a", // Slate 900 for text
                primary: {
                    DEFAULT: "#0ea5e9", // Sky Blue - Trust
                    foreground: "#ffffff",
                    hover: "#0284c7",
                    light: "#e0f2fe", // Very light blue for backgrounds
                },
                secondary: {
                    DEFAULT: "#f8fafc", // Slate 50 - Light background
                    foreground: "#1e293b",
                    hover: "#f1f5f9",
                },
                accent: {
                    DEFAULT: "#f97316", // Orange
                    foreground: "#ffffff",
                    light: "#ffedd5", // Light orange bg
                },
                success: {
                    DEFAULT: "#22c55e", // Green - "Join Circle" button color
                    foreground: "#ffffff",
                    light: "#dcfce7",
                },
                muted: {
                    DEFAULT: "#f1f5f9", // Light gray
                    foreground: "#64748b", // Slate 500
                },
                card: {
                    DEFAULT: "#ffffff",
                    foreground: "#0f172a",
                    border: "#e2e8f0", // Slate 200
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Playfair Display', 'serif'], // New Serif font
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
