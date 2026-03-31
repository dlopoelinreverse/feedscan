import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — FeedScan",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
      <div className="prose mt-8 text-foreground space-y-4">
        <p>This page will contain the FeedScan privacy policy.</p>
      </div>
    </div>
  );
}
