"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { deleteForm } from "@/lib/actions/form-actions";

interface FormDeleteButtonProps {
  formId: string;
  variant?: "button" | "menuitem";
}

export function FormDeleteButton({ formId, variant = "button" }: FormDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const t = useTranslations("common");
  const tForms = useTranslations("forms");
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteForm(formId);
      toast({ title: t("success") });
      router.push("/dashboard/forms");
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {variant === "menuitem" ? (
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            setOpen(true);
          }}
          className="text-destructive focus:text-destructive"
        >
          {t("delete")}
        </DropdownMenuItem>
      ) : (
        <Button variant="destructive" onClick={() => setOpen(true)}>
          {t("delete")}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tForms("detail.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {tForms("detail.deleteConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("loading") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
