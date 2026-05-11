"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
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
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  listQRCodes,
  createQRCode,
  type QRCodeItem,
} from "@/lib/actions/qrcode-actions";

interface QRCodesTabProps {
  formId: string;
  formTitle: string;
  userPlan: string;
}

export function QRCodesTab({ formId, formTitle, userPlan }: QRCodesTabProps) {
  const t = useTranslations("qrCodes");
  const tCommon = useTranslations("common");

  const [codes, setCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    listQRCodes(formId)
      .then(setCodes)
      .catch(() => toast({ title: tCommon("error"), variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [formId, tCommon]);

  const canCreate = userPlan !== "FREE" || codes.length < 1;

  const handleCreate = async () => {
    if (!label.trim()) return;
    setCreating(true);
    try {
      const created = await createQRCode(formId, label.trim());
      setCodes((prev) => [created, ...prev]);
      setLabel("");
      setDialogOpen(false);
      toast({ title: t("created") });
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

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t("linkCopied") });
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    }
  };

  const downloadPng = (codeId: string, codeLabel: string) => {
    const a = document.createElement("a");
    a.href = `/api/qrcodes/${codeId}/download`;
    a.download = `qrcode-${codeLabel.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold truncate">
            {t("title")} — {formTitle}
          </h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={!canCreate}
          size="sm"
          className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white shrink-0 sm:h-10 sm:px-4"
        >
          + {t("generate")}
        </Button>
      </div>

      {!canCreate && (
        <p className="text-xs text-muted-foreground">{t("planLimit")}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      ) : codes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {codes.map((code) => (
            <QRCodeRow
              key={code.id}
              code={code}
              onCopy={() => copyLink(code.url)}
              onDownload={() => downloadPng(code.id, code.label)}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
    </div>
  );
}

function QRCodeRow({
  code,
  onCopy,
  onDownload,
}: {
  code: QRCodeItem;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const t = useTranslations("qrCodes");
  const tCommon = useTranslations("common");
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(code.url, {
      width: 200,
      margin: 1,
      color: { dark: "#1A1A1A", light: "#FFFFFF" },
    }).then(setDataUrl);
  }, [code.url]);

  return (
    <Card className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white rounded-md border border-border flex items-center justify-center overflow-hidden">
        {dataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={code.label}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{code.label}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {code.url}
        </p>
        <p className="text-xs text-[#6C5CE7] font-medium mt-1">
          {t("scans", { count: code.scans })}
        </p>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        <Button variant="outline" size="sm" onClick={onDownload} className="text-xs h-8 px-2">
          ↓ {t("downloadShort")}
        </Button>
        <Button variant="outline" size="sm" onClick={onCopy} className="text-xs h-8 px-2">
          {tCommon("copy")}
        </Button>
      </div>
    </Card>
  );
}
