"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface QRCodesRowActionsProps {
  codeId: string;
  url: string;
  label: string;
}

export function QRCodesRowActions({
  codeId,
  url,
  label,
}: QRCodesRowActionsProps) {
  const t = useTranslations("qrCodes");
  const tCommon = useTranslations("common");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t("linkCopied") });
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = `/api/qrcodes/${codeId}/download`;
    a.download = `qrcode-${label.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col gap-1 shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="text-xs h-8 px-2"
      >
        ↓ {t("downloadShort")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="text-xs h-8 px-2"
      >
        {tCommon("copy")}
      </Button>
    </div>
  );
}
