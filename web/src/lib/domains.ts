const isDev =
  process.env.NODE_ENV === "development" ||
  !process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
  process.env.NEXT_PUBLIC_ROOT_DOMAIN.includes("localhost");

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
