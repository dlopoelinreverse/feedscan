interface PublicFormPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { slug } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <p className="text-muted-foreground text-center">Loading form: {slug}</p>
      </div>
    </div>
  );
}
