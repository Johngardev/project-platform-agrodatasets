/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#65a30d",
        "primary-hover": "#4d7c0f",

        "background-light": "#f8fafc",
        "background-dark": "#0f172a",

        "secondary-dark": "#1e293b",   // Slate-800 (Sidebar, Tarjetas)
        "border-dark": "#334155",      // Slate-700 (Bordes sutiles)
        "text-muted": "#94a3b8",
      },
      fontFamily: {
        "display": ["Space Grotesk", "sans-serif"], // Títulos
        "body": ["Noto Sans", "sans-serif"],        // Texto corrido
      },
      borderRadius: {
        "DEFAULT": "0.25rem", 
        "lg": "0.5rem", 
        "xl": "0.75rem", 
        "full": "9999px"
      },
    },
  },
  plugins: [],
}
