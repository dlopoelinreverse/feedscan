interface FormDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormDetailPage({ params }: FormDetailPageProps) {
  const { id } = await params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Form Details</h1>
      <p className="text-muted-foreground mt-1">Form ID: {id}</p>
    </div>
  );
}
