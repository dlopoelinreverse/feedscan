import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-5xl font-bold text-primary">FeedScan</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Collect customer feedback instantly with smart QR codes and AI-powered forms.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
          <Link
            href="/register"
            className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
