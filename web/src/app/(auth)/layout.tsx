import { getRootUrl } from "@/lib/domains";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <main className="flex-1">{children}</main>
      <footer className="py-4 text-center">
        <a
          href={getRootUrl()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Propulsé par <span className="font-medium text-primary">FeedScan</span>
        </a>
      </footer>
    </div>
  );
}
