import { themeCssVarStyle } from "@/lib/themes/css-vars";
import { themeFontClasses } from "@/lib/themes/fonts";
import type { ThemeConfig } from "@/lib/themes/types";
import "./themed-form.css";

interface ThemedFormShellProps {
  theme: ThemeConfig;
  children: React.ReactNode;
  className?: string;
  fillParent?: boolean;
}

export function ThemedFormShell({
  theme,
  children,
  className,
  fillParent = false,
}: ThemedFormShellProps) {
  const style = themeCssVarStyle(theme);
  return (
    <div
      className={`fs-theme-root ${themeFontClasses} ${
        fillParent ? "fs-fill-parent" : "fs-min-screen"
      } ${className ?? ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
