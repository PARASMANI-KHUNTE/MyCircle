/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--primary) / ${opacityValue})` : "rgb(var(--primary))",
                    foreground: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--primary-foreground) / ${opacityValue})` : "rgb(var(--primary-foreground))",
                    hover: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--primary-hover) / ${opacityValue})` : "rgb(var(--primary-hover))",
                },
                secondary: {
                    DEFAULT: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--secondary) / ${opacityValue})` : "rgb(var(--secondary))",
                    foreground: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--secondary-foreground) / ${opacityValue})` : "rgb(var(--secondary-foreground))",
                    hover: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--secondary-hover) / ${opacityValue})` : "rgb(var(--secondary-hover))",
                },
                accent: {
                    DEFAULT: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--accent) / ${opacityValue})` : "rgb(var(--accent))",
                    foreground: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--accent-foreground) / ${opacityValue})` : "rgb(var(--accent-foreground))",
                },
                muted: {
                    DEFAULT: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--muted) / ${opacityValue})` : "rgb(var(--muted))",
                    foreground: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--muted-foreground) / ${opacityValue})` : "rgb(var(--muted-foreground))",
                },
                card: {
                    DEFAULT: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--card) / ${opacityValue})` : "rgb(var(--card) / 0.6)",
                    foreground: ({ opacityValue }) => opacityValue !== undefined ? `rgb(var(--card-foreground) / ${opacityValue})` : "rgb(var(--card-foreground))",
                    border: ({ opacityValue }) => {
                        // Light theme uses higher opacity for border
                        return opacityValue !== undefined ? `rgb(var(--card-border) / ${opacityValue})` : "rgb(var(--card-border) / 0.15)";
                    },
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
