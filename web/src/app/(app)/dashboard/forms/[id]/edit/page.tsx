interface FormEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormEditPage({ params }: FormEditPageProps) {
  const { id } = await params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Edit Form</h1>
      <p className="text-muted-foreground mt-1">Editing form: {id}</p>
    </div>
  );
}
