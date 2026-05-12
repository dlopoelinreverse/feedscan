import { FormBuilder } from "@/components/forms/form-builder";
import { getUserProfile } from "@/lib/actions/form-actions";

export default async function NewFormPage() {
  const userProfile = await getUserProfile();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <FormBuilder userProfile={userProfile ?? undefined} />
    </div>
  );
}
