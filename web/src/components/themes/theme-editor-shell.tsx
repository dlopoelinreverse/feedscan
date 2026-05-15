"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeEditor } from "./theme-editor";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { ThemeConfig } from "@/lib/themes/types";
import type { FormBuilderState } from "@/components/forms/types";

interface ThemeEditorShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  initialName: string;
  initialConfig: ThemeConfig;
  previewForm: FormBuilderState;
  onSave: (input: { name: string; config: ThemeConfig }) => Promise<void> | void;
  saving?: boolean;
  showName?: boolean;
}

export function ThemeEditorShell({
  open,
  onOpenChange,
  title,
  initialName,
  initialConfig,
  previewForm,
  onSave,
  saving,
  showName = true,
}: ThemeEditorShellProps) {
  const t = useTranslations("themes");
  const isMobile = useIsMobile();
  const heading = title ?? t("editor.title");

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[92vh] overflow-y-auto rounded-t-2xl p-4"
        >
          <SheetHeader className="mb-3">
            <SheetTitle>{heading}</SheetTitle>
          </SheetHeader>
          <ThemeEditor
            initialName={initialName}
            initialConfig={initialConfig}
            previewForm={previewForm}
            onCancel={() => onOpenChange(false)}
            onSave={async (i) => {
              await onSave(i);
              onOpenChange(false);
            }}
            saving={saving}
            showName={showName}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
        </DialogHeader>
        <ThemeEditor
          initialName={initialName}
          initialConfig={initialConfig}
          previewForm={previewForm}
          onCancel={() => onOpenChange(false)}
          onSave={async (i) => {
            await onSave(i);
            onOpenChange(false);
          }}
          saving={saving}
          showName={showName}
        />
      </DialogContent>
    </Dialog>
  );
}
