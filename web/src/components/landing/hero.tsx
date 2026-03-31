import Link from "next/link";

export function Hero() {
  return (
    <section className="py-24 px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Collect Feedback <span className="text-primary">Instantly</span>
      </h1>
      <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
        Create smart feedback forms and share them via QR codes. Get actionable insights powered by AI.
      </p>
      <div className="mt-10 flex gap-4 justify-center">
        <Link
          href="/register"
          className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Start for Free
        </Link>
        <Link
          href="#how-it-works"
          className="border border-border px-8 py-3 rounded-lg font-medium hover:bg-muted transition-colors"
        >
          See How It Works
        </Link>
      </div>
    </section>
  );
}
