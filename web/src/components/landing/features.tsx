export function Features() {
  const features = [
    { title: "QR Code Integration", description: "Generate QR codes for any form instantly." },
    { title: "AI-Powered Forms", description: "Let AI build your feedback forms from a prompt." },
    { title: "Smart Analytics", description: "Understand your feedback with real-time analytics." },
  ];

  return (
    <section id="features" className="py-24 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border border-border p-6 space-y-2">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
