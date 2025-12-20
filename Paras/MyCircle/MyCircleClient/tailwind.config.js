/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#09090b", // Zinc 950
                foreground: "#fafafa", // Zinc 50
                primary: {
                    DEFAULT: "#8b5cf6", // Violet 500
                    foreground: "#ffffff",
                    hover: "#7c3aed",
                },
                secondary: {
                    DEFAULT: "#27272a", // Zinc 800
                    foreground: "#fafafa",
                    hover: "#3f3f46",
                },
                accent: {
                    DEFAULT: "#e11d48", // Rose 600
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "#18181b", // Zinc 900
                    foreground: "#a1a1aa", // Zinc 400
                },
                card: {
                    DEFAULT: "rgba(24, 24, 27, 0.6)", // Glassmorphism base
                    foreground: "#fafafa",
                    border: "rgba(255, 255, 255, 0.1)",
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'], // For Headings
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
