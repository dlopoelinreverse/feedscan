export function HowItWorks() {
  const steps = [
    { step: "1", title: "Create a Form", description: "Build your feedback form or let AI do it." },
    { step: "2", title: "Generate QR Code", description: "Get a unique QR code for each location." },
    { step: "3", title: "Collect Feedback", description: "Customers scan and submit feedback instantly." },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 bg-muted/30">
      <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((s) => (
          <div key={s.step} className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
              {s.step}
            </div>
            <h3 className="font-semibold">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
