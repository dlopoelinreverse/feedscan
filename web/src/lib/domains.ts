export function getAuthUrl(path: string = "/login"): string {
  const domain = process.env.NEXT_PUBLIC_AUTH_DOMAIN || "localhost:3000";
  const protocol = domain.includes("localhost") ? "http" : "https";
  return `${protocol}://${domain}${path}`;
}

export function getAppUrl(path: string = "/dashboard"): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
  const protocol = domain.includes("localhost") ? "http" : "https";
  return `${protocol}://${domain}${path}`;
}

export function getRootUrl(path: string = "/"): string {
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  const protocol = domain.includes("localhost") ? "http" : "https";
  return `${protocol}://${domain}${path}`;
}

export function getFormUrl(slug: string): string {
  return getRootUrl(`/f/${slug}`);
}
