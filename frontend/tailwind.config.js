/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      colors: {
        bg: {
          base: "#0A0B0D",
          surface: "#131418",
          surfaceAlt: "#1B1D22",
        },
        border: {
          subtle: "#2A2D33",
        },
        text: {
          primary: "#F2F3F5",
          secondary: "#9AA0AA",
          muted: "#5C616B",
        },
        accent: {
          primary: "#E23B3B",
          primaryHover: "#FF4D4D",
          secondary: "#7B5CF0",
          warn: "#E2A63B",
          success: "#35C577",
          danger: "#E24B4B",
        },
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        glow: "0 0 24px rgba(226,59,59,0.25)",
        glowLg: "0 0 60px rgba(226,59,59,0.18)",
        glowPurple: "0 0 40px rgba(123,92,240,0.2)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        "scan-line": "scan-line 4s linear infinite",
      },
    },
  },
  plugins: [],
};
