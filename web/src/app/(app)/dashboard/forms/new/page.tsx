import { FormBuilder } from "@/components/forms/form-builder";

export default function NewFormPage() {
  return (
    <div className="h-[calc(100vh-49px)] md:h-screen flex flex-col">
      <FormBuilder />
    </div>
  );
}
