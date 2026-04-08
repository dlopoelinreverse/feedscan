const isDev =
  process.env.NODE_ENV === "development" ||
  !process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
  process.env.NEXT_PUBLIC_ROOT_DOMAIN.includes("localhost");

const DEV_ORIGIN = `http://localhost:${process.env.NEXT_PUBLIC_PORT || "3001"}`;

/**
 * Returns a relative path in dev, or full subdomain URL in production.
 * Use for <a href>, window.location.href, and client-side navigation.
 */
export function getAuthUrl(path: string = "/login"): string {
  if (isDev) return path;
  const domain = process.env.NEXT_PUBLIC_AUTH_DOMAIN!;
  return `https://${domain}${path}`;
}

export function getAppUrl(path: string = "/dashboard"): string {
  if (isDev) return path;
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN!;
  return `https://${domain}${path}`;
}

export function getRootUrl(path: string = "/"): string {
  if (isDev) return path;
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
  return `https://${domain}${path}`;
}

export function getFormUrl(slug: string): string {
  return getRootUrl(`/f/${slug}`);
}

/**
 * Returns an absolute URL — required for OAuth redirectTo and server-side redirects.
 * In dev: http://localhost:3001/path
 * In prod: https://auth.feedscan.leopoldev/path
 */
export function getAbsoluteAuthUrl(path: string = "/login"): string {
  if (isDev) return `${DEV_ORIGIN}${path}`;
  const domain = process.env.NEXT_PUBLIC_AUTH_DOMAIN!;
  return `https://${domain}${path}`;
}

export function getAbsoluteAppUrl(path: string = "/dashboard"): string {
  if (isDev) return `${DEV_ORIGIN}${path}`;
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN!;
  return `https://${domain}${path}`;
}

export function getAbsoluteRootUrl(path: string = "/"): string {
  if (isDev) return `${DEV_ORIGIN}${path}`;
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
  return `https://${domain}${path}`;
}

/** Absolute public form URL — used for QR code encoding and sharing */
export function getAbsoluteFormUrl(slug: string): string {
  return getAbsoluteRootUrl(`/f/${slug}`);
}
