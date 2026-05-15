import {
  Inter,
  Manrope,
  Poppins,
  Playfair_Display,
  Lora,
  Crimson_Text,
} from "next/font/google";
import type { ThemeFont } from "./types";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-theme-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-theme-manrope",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-theme-poppins",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-theme-playfair",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-theme-lora",
  display: "swap",
});

const crimson = Crimson_Text({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-theme-crimson",
  display: "swap",
});

export const themeFontClasses = [
  inter.variable,
  manrope.variable,
  poppins.variable,
  playfair.variable,
  lora.variable,
  crimson.variable,
].join(" ");

const FONT_STACKS: Record<ThemeFont, string> = {
  inter: "var(--font-theme-inter), system-ui, -apple-system, sans-serif",
  manrope: "var(--font-theme-manrope), system-ui, -apple-system, sans-serif",
  poppins: "var(--font-theme-poppins), system-ui, -apple-system, sans-serif",
  playfair: "var(--font-theme-playfair), Georgia, serif",
  lora: "var(--font-theme-lora), Georgia, serif",
  crimson: "var(--font-theme-crimson), Georgia, serif",
};

export function fontStack(font: ThemeFont): string {
  return FONT_STACKS[font] ?? FONT_STACKS.inter;
}

export const FONT_SERIF: Record<ThemeFont, boolean> = {
  inter: false,
  manrope: false,
  poppins: false,
  playfair: true,
  lora: true,
  crimson: true,
};
