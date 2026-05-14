import { deriveColors, RADIUS_PX } from "./colors";
import { fontStack } from "./fonts";
import type { ThemeConfig } from "./types";

export function themeCssVars(config: ThemeConfig): Record<string, string> {
  const colors = deriveColors(config.primaryColor, config.backgroundColor);
  return {
    "--fs-primary": colors.primary,
    "--fs-primary-hover": colors.primaryHover,
    "--fs-primary-soft": colors.primarySoft,
    "--fs-primary-on": colors.primaryOnPrimary,
    "--fs-bg": colors.background,
    "--fs-text": colors.text,
    "--fs-text-muted": colors.mutedText,
    "--fs-border": colors.border,
    "--fs-soft": colors.softGray,
    "--fs-ring": colors.ringSoft,
    "--fs-radius": RADIUS_PX[config.borderRadius],
    "--fs-radius-sm": "6px",
    "--fs-radius-full": "9999px",
    "--fs-font": fontStack(config.fontFamily),
  };
}

export function themeCssVarStyle(
  config: ThemeConfig
): React.CSSProperties {
  return themeCssVars(config) as unknown as React.CSSProperties;
}
