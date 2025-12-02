/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#1E40AF',
          light: '#DBEAFE',
        },
        admin: '#EF4444',
        teacher: '#8B5CF6',
        student: '#3B82F6',
      },
    },
  },
  plugins: [],
}
