/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // --- COLORES DEL NUEVO DISEÑO (Avocado DataHub) ---
        
        "primary": "#65a30d",       // Lime-600 (Tu verde aguacate)
        "primary-hover": "#4d7c0f", // Lime-700
        
        // Fondos específicos del diseño Stitch
        "background-light": "#f6f6f8", 
        "background-dark": "#101622",  // El azul casi negro del fondo
        
        // Superficies (Tarjetas)
        "surface-light": "#ffffff",
        "surface-dark": "#192233",     // El azul grisáceo de las tarjetas
        "surface-dark-highlight": "#1e293b",
        
        // Bordes
        "border-light": "#e2e8f0",
        "border-dark": "#232f48",      // Color de los bordes del diseño
        
        // Textos
        "text-primary-dark": "#ffffff",
        "text-secondary-dark": "#92a4c9", // El texto gris azulado
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
      animation: {
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
