/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primario': '#4B66DE',    // Azul neutro y profesional
        'primario-dark': '#3A4FA8',
        'secundario': '#5D6D7E',
        'secundario-dark': '#4A5A6B',
        'terciario': '#8B6B4D',
        'fondo': '#FAF7F2',
        'texto': '#020202',
        'texto-claro': '#5D6D7E',
        'exito': '#2C5F2D',
        'alerta': '#C44545',
        'info': '#5D6D7E',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}