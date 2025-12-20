/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: "#09090b",
                foreground: "#fafafa",
                primary: {
                    DEFAULT: "#8b5cf6",
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "#27272a",
                    foreground: "#fafafa",
                },
                accent: {
                    DEFAULT: "#e11d48",
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "#18181b",
                    foreground: "#a1a1aa",
                },
                card: {
                    DEFAULT: "rgba(24, 24, 27, 0.8)",
                    border: "rgba(255, 255, 255, 0.1)",
                }
            },
        },
    },
    plugins: [],
}
