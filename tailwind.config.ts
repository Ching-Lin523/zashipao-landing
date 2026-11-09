import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFDF8",
        citron: "#E7F36A",
        coral: "#C45F38",
        pine: "#244D3D",
        sky: "#BFDDF5",
        cream: {
          DEFAULT: "#FAF7F2",
          d: "#F0EBE0",
          dd: "#E5DED3"
        },
        border: {
          DEFAULT: "#DDD6CB",
          d: "#C8C0B4"
        },
        ink: "#1C1917",
        muted: "#6B6258",
        light: "#A89E95",
        terracotta: {
          DEFAULT: "#C45F38",
          d: "#A94D2D",
          lt: "#FFF0EB"
        },
        forest: {
          DEFAULT: "#4A7260",
          lt: "#DFF0E9"
        },
        lavender: {
          DEFAULT: "#7062A3",
          lt: "#EEEAF8"
        },
        amberish: {
          DEFAULT: "#B87C20",
          lt: "#F7EDD8"
        }
      },
      boxShadow: {
        soft: "0 2px 16px rgba(28,25,23,.08)",
        lift: "0 12px 40px rgba(28,25,23,.14)",
        editorial: "0 24px 70px rgba(28,25,23,.16)"
      },
      spacing: {
        "22": "5.5rem"
      },
      borderRadius: {
        xl2: "28px"
      },
      fontFamily: {
        sans: ["Noto Sans TC", "sans-serif"],
        serif: ["Noto Serif TC", "serif"]
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: ".4", transform: "scale(.75)" }
        },
        tick: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        }
      },
      animation: {
        blink: "blink 1.6s ease-in-out infinite",
        tick: "tick 40s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
