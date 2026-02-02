module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Vibrant Circle Palette
        background: "#09090b",
        surface: "#18181b",
        primary: "#8b5cf6", // Violet-500
        secondary: "#06b6d4", // Cyan-500 (Updated from Blue)
        accent: "#ec4899", // Pink-500 (Updated from Orange)

        // Status Colors
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",

        // Text Colors
        text: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
          tertiary: "#64748b",
        },

        // Glassmorphism helper colors (used with opacity)
        glass: {
          light: "#ffffff",
          dark: "#000000",
        }
      },
      fontFamily: {
        sans: ["System", "sans-serif"],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      }
    },
  },
  presets: [require("nativewind/preset")],
  plugins: [],
}
