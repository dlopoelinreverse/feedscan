import { getTranslations } from "next-intl/server";
import { getRootUrl } from "@/lib/domains";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="py-4 text-center">
        <a
          href={getRootUrl()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("poweredBy")}
        </a>
      </footer>
    </div>
  );
}
