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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { createQRCode } from "@/lib/actions/qrcode-actions";

interface QRCodesGenerateButtonProps {
  formId: string;
  disabled?: boolean;
}

export function QRCodesGenerateButton({
  formId,
  disabled,
}: QRCodesGenerateButtonProps) {
  const t = useTranslations("qrCodes");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!label.trim()) return;
    setCreating(true);
    try {
      await createQRCode(formId, label.trim());
      setLabel("");
      setOpen(false);
      toast({ title: t("created") });
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      if (message === "PLAN_LIMIT") {
        toast({ title: t("planLimit"), variant: "destructive" });
      } else {
        toast({ title: tCommon("error"), variant: "destructive" });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled}
        size="sm"
        className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white w-full sm:w-auto sm:h-10 sm:px-4"
      >
        + {t("generate")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("generate")}</DialogTitle>
            <DialogDescription>{t("labelHelp")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("label")}</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("labelPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!label.trim() || creating}
              className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white"
            >
              {creating ? tCommon("loading") : t("generate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
