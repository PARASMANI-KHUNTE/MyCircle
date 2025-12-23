module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#8b5cf6",
        secondary: "#1e1b4b",
        background: "#09090b",
      }
    },
  },
  presets: [require("nativewind/preset")],
  plugins: [],
}
