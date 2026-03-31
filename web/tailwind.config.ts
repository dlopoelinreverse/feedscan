import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6C5CE7",
          foreground: "#ffffff",
          50: "#f0effe",
          100: "#e4e0fd",
          200: "#ccc5fb",
          300: "#ab9ef8",
          400: "#8870f3",
          500: "#6C5CE7",
          600: "#5a43d4",
          700: "#4c34b8",
          800: "#402d96",
          900: "#362a79",
        },
        secondary: {
          DEFAULT: "#00B894",
          foreground: "#ffffff",
          50: "#e6faf6",
          100: "#c2f2e8",
          200: "#85e4d2",
          300: "#47d6bc",
          400: "#1ac7a5",
          500: "#00B894",
          600: "#009879",
          700: "#007a60",
          800: "#005f4b",
          900: "#004a3a",
        },
        accent: {
          DEFAULT: "#FDCB6E",
          foreground: "#1a1a1a",
          50: "#fffbf0",
          100: "#fff3d1",
          200: "#ffe5a3",
          300: "#fed475",
          400: "#FDCB6E",
          500: "#fcba47",
          600: "#f0a020",
          700: "#c47d10",
          800: "#9a600d",
          900: "#7a4c0b",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
