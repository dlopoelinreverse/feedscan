"use client";

import type { ThemeConfig } from "@/lib/themes/types";
import { FONT_SERIF } from "@/lib/themes/fonts";
import { deriveColors } from "@/lib/themes/colors";

interface PresetThumbnailProps {
  config: ThemeConfig;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const RADIUS = { sm: 6, md: 12, lg: 22 };

export function PresetThumbnail({
  config,
  label,
  size = "md",
}: PresetThumbnailProps) {
  const colors = deriveColors(config.primaryColor, config.backgroundColor);
  const r = RADIUS[config.borderRadius];
  const isSerif = FONT_SERIF[config.fontFamily];
  const h = size === "sm" ? 56 : size === "md" ? 72 : 96;

  return (
    <div
      className="w-full overflow-hidden border"
      style={{
        background: colors.background,
        borderColor: colors.border,
        borderRadius: r,
        height: h,
      }}
    >
      <div className="flex flex-col h-full px-3 py-2 gap-1.5">
        <div
          className="font-bold"
          style={{
            color: colors.text,
            fontSize: size === "sm" ? 10 : 12,
            fontFamily: isSerif ? "Georgia, serif" : "system-ui, sans-serif",
          }}
        >
          {label ?? "Aa"}
        </div>
        <div className="flex gap-1">
          <span
            className="inline-block"
            style={{
              width: size === "sm" ? 16 : 22,
              height: size === "sm" ? 6 : 8,
              background: colors.primary,
              borderRadius: Math.min(r, 6),
            }}
          />
          <span
            className="inline-block"
            style={{
              width: size === "sm" ? 22 : 32,
              height: size === "sm" ? 6 : 8,
              background: colors.primarySoft,
              borderRadius: Math.min(r, 6),
            }}
          />
        </div>
      </div>
    </div>
  );
}
