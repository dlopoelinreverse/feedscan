import { FormBuilder } from "@/components/forms/form-builder";
import { getUserProfile } from "@/lib/actions/form-actions";

export default async function NewFormPage() {
  const userProfile = await getUserProfile();

  return (
    <div className="h-[calc(100dvh-57px)] md:h-screen flex flex-col overflow-hidden">
      <FormBuilder userProfile={userProfile ?? undefined} />
    </div>
  );
}
