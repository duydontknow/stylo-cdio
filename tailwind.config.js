/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FAF9F6", // Trắng gạo tạo cảm giác sang trọng
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#0F172A", // Đen nhám (slate-900)
          hover: "#1E293B",
        },
        ai: {
          DEFAULT: "#8B5CF6", // Tím violet - màu đặc trưng của AI
          light: "#A78BFA",
          glow: "rgba(139, 92, 246, 0.15)",
        },
        muted: "#94A3B8", // Xám để làm mờ các text phụ
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.05)',
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
/* force-reload-vite */
