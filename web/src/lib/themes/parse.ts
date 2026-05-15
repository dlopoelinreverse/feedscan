import { PRESETS } from "./presets";
import { FONT_KEYS, RADIUS_KEYS, type ThemeConfig, type ThemePresetId } from "./types";
import { isValidHex, normalizeHex } from "./colors";

const PRESET_IDS = new Set<ThemePresetId>(["minimal", "warm", "bold", "elegant"]);

export function parseThemeConfig(raw: unknown): ThemeConfig {
  const fallback = PRESETS.minimal;
  if (!raw || typeof raw !== "object") return { ...fallback };
  const o = raw as Record<string, unknown>;

  const preset =
    typeof o.preset === "string" && PRESET_IDS.has(o.preset as ThemePresetId)
      ? (o.preset as ThemePresetId)
      : fallback.preset;

  const primaryColor =
    typeof o.primaryColor === "string" && isValidHex(o.primaryColor)
      ? normalizeHex(o.primaryColor)
      : fallback.primaryColor;

  const backgroundColor =
    typeof o.backgroundColor === "string" && isValidHex(o.backgroundColor)
      ? normalizeHex(o.backgroundColor)
      : fallback.backgroundColor;

  const fontFamily =
    typeof o.fontFamily === "string" &&
    (FONT_KEYS as string[]).includes(o.fontFamily)
      ? (o.fontFamily as ThemeConfig["fontFamily"])
      : fallback.fontFamily;

  const borderRadius =
    typeof o.borderRadius === "string" &&
    (RADIUS_KEYS as string[]).includes(o.borderRadius)
      ? (o.borderRadius as ThemeConfig["borderRadius"])
      : fallback.borderRadius;

  const logoUrl =
    typeof o.logoUrl === "string" && o.logoUrl.length > 0 ? o.logoUrl : null;

  return { preset, primaryColor, backgroundColor, fontFamily, borderRadius, logoUrl };
}
