module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neon Dark Reference Palette
        background: "#09090b",
        "background-dark": "#0a0a0a",
        surface: "#18181b",
        primary: "#af25f4", // Stitch Violet
        secondary: "#06b6d4",
        "accent-cyan": "#00f5ff",
        "accent-violet": "#8c25f4",
        error: "#f20d0d", // Stitch Red

        // Status Colors
        success: "#10b981",
        warning: "#f59e0b",

        // Text Colors
        text: {
          primary: "#ffffff",
          secondary: "#94a3b8",
          tertiary: "#64748b",
        },

        // Glassmorphism helper colors
        glass: {
          white: "rgba(255, 255, 255, 0.05)",
          border: "rgba(255, 255, 255, 0.1)",
        }
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        sans: ["System", "sans-serif"],
      },
      borderRadius: {
        'lg': '1rem',
        'xl': '2rem',
        '2xl': '3rem',
        'full': '9999px',
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
