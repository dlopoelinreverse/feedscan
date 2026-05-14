export type ThemeFont =
  | "inter"
  | "manrope"
  | "poppins"
  | "playfair"
  | "lora"
  | "crimson";

export type ThemeRadius = "sm" | "md" | "lg";

export type ThemePresetId = "minimal" | "warm" | "bold" | "elegant";

export interface ThemeConfig {
  preset: ThemePresetId;
  primaryColor: string;
  backgroundColor: string;
  fontFamily: ThemeFont;
  borderRadius: ThemeRadius;
  logoUrl: string | null;
}

export interface ThemeRecord {
  id: string;
  name: string;
  config: ThemeConfig;
  isDefault: boolean;
}

export const FONT_KEYS: ThemeFont[] = [
  "inter",
  "manrope",
  "poppins",
  "playfair",
  "lora",
  "crimson",
];

export const RADIUS_KEYS: ThemeRadius[] = ["sm", "md", "lg"];
