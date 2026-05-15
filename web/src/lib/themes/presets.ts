import type { ThemeConfig, ThemePresetId } from "./types";

export const BACKGROUND_PALETTE: { key: string; hex: string }[] = [
  { key: "white", hex: "#FFFFFF" },
  { key: "cream", hex: "#FAF6EE" },
  { key: "mist", hex: "#F1F4F8" },
  { key: "sand", hex: "#F3ECE0" },
  { key: "blush", hex: "#FAEFEF" },
  { key: "sage", hex: "#EEF3EC" },
  { key: "lavender", hex: "#F0EEFA" },
  { key: "graphite", hex: "#1B1F23" },
];

export const PRESETS: Record<ThemePresetId, ThemeConfig> = {
  minimal: {
    preset: "minimal",
    primaryColor: "#6C5CE7",
    backgroundColor: "#FFFFFF",
    fontFamily: "inter",
    borderRadius: "md",
    logoUrl: null,
  },
  warm: {
    preset: "warm",
    primaryColor: "#E07A5F",
    backgroundColor: "#FAF6EE",
    fontFamily: "manrope",
    borderRadius: "lg",
    logoUrl: null,
  },
  bold: {
    preset: "bold",
    primaryColor: "#111827",
    backgroundColor: "#FFFFFF",
    fontFamily: "poppins",
    borderRadius: "sm",
    logoUrl: null,
  },
  elegant: {
    preset: "elegant",
    primaryColor: "#7A5A3A",
    backgroundColor: "#FAEFEF",
    fontFamily: "playfair",
    borderRadius: "md",
    logoUrl: null,
  },
};

export const PRESET_ORDER: ThemePresetId[] = [
  "minimal",
  "warm",
  "bold",
  "elegant",
];

export function getPreset(id: ThemePresetId): ThemeConfig {
  return PRESETS[id];
}
