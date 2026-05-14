export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function normalizeHex(hex: string): string {
  const v = hex.trim().replace(/^#/, "");
  if (v.length === 3) {
    return `#${v
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase()}`;
  }
  if (v.length === 6) return `#${v.toUpperCase()}`;
  return "#000000";
}

export function isValidHex(hex: string): boolean {
  return /^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/.test(hex.trim());
}

export function hexToRgb(hex: string): RGB {
  const v = normalizeHex(hex).slice(1);
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rr:
        h = (gg - bb) / d + (gg < bb ? 6 : 0);
        break;
      case gg:
        h = (bb - rr) / d + 2;
        break;
      default:
        h = (rr - gg) / d + 4;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb({ h, s, l }: { h: number; s: number; l: number }): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

export function darken(hex: string, amount: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.l = Math.max(0, hsl.l - amount);
  return rgbToHex(hslToRgb(hsl));
}

export function lighten(hex: string, amount: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.l = Math.min(1, hsl.l + amount);
  return rgbToHex(hslToRgb(hsl));
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function srgbChannel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * srgbChannel(r) +
    0.7152 * srgbChannel(g) +
    0.0722 * srgbChannel(b)
  );
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

export function meetsWcagAA(text: string, bg: string): boolean {
  return contrastRatio(text, bg) >= 4.5;
}

export function readableTextOn(bg: string): string {
  return relativeLuminance(bg) > 0.55 ? "#1A1A1A" : "#FFFFFF";
}

export function mutedTextOn(bg: string): string {
  return relativeLuminance(bg) > 0.55 ? "#5A5A5A" : "#CFCFCF";
}

export function subtleBorderOn(bg: string): string {
  return relativeLuminance(bg) > 0.55 ? "#E5E7EB" : "#FFFFFF22";
}

export interface DerivedColors {
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primaryOnPrimary: string;
  background: string;
  text: string;
  mutedText: string;
  border: string;
  softGray: string;
  ringSoft: string;
}

export function deriveColors(
  primary: string,
  background: string
): DerivedColors {
  const primaryHover = darken(primary, 0.08);
  const primarySoft = withAlpha(primary, 0.12);
  const primaryOnPrimary = readableTextOn(primary);
  const text = readableTextOn(background);
  const mutedText = mutedTextOn(background);
  const border = subtleBorderOn(background);
  const softGray =
    relativeLuminance(background) > 0.55 ? "#F3F4F6" : "#FFFFFF14";
  const ringSoft = withAlpha(primary, 0.35);
  return {
    primary,
    primaryHover,
    primarySoft,
    primaryOnPrimary,
    background,
    text,
    mutedText,
    border,
    softGray,
    ringSoft,
  };
}

export const RADIUS_PX: Record<"sm" | "md" | "lg", string> = {
  sm: "6px",
  md: "12px",
  lg: "22px",
};
