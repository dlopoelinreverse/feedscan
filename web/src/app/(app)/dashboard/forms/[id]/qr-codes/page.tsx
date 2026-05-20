import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getTranslations } from "next-intl/server";
import { getFormById, getUserPlan } from "@/lib/actions/form-actions";
import { listQRCodes } from "@/lib/actions/qrcode-actions";
import { Card } from "@/components/ui/card";
import { QRCodesGenerateButton } from "@/components/forms/qr-codes-generate-button";
import { QRCodesRowActions } from "@/components/forms/qr-codes-row-actions";

interface QRCodesPageProps {
  params: Promise<{ id: string }>;
}

export default async function QRCodesPage({ params }: QRCodesPageProps) {
  const { id } = await params;
  const t = await getTranslations("qrCodes");

  const [form, plan, codes] = await Promise.all([
    getFormById(id),
    getUserPlan(),
    listQRCodes(id),
  ]);

  if (!form) notFound();

  const canCreate = plan !== "FREE" || codes.length < 1;

  const codesWithQr = await Promise.all(
    codes.map(async (c) => ({
      id: c.id,
      label: c.label,
      url: c.url,
      scans: c.scans,
      dataUrl: await QRCode.toDataURL(c.url, {
        width: 200,
        margin: 1,
        color: { dark: "#1A1A1A", light: "#FFFFFF" },
      }),
    }))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold break-words">
            {t("title")} — {form.title}
          </h2>
          <p className="text-sm text-muted-foreground break-words">
            {t("subtitle")}
          </p>
        </div>
        <div className="sm:shrink-0">
          <QRCodesGenerateButton formId={id} disabled={!canCreate} />
        </div>
      </div>

      {!canCreate && (
        <p className="text-xs text-muted-foreground break-words">
          {t("planLimit")}
        </p>
      )}

      {codesWithQr.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {codesWithQr.map((code) => (
            <Card
              key={code.id}
              className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white rounded-md border border-border flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={code.dataUrl}
                  alt={code.label}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold break-words">{code.label}</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {code.url}
                </p>
                <p className="text-xs text-[#6C5CE7] font-medium mt-1 whitespace-nowrap">
                  {t("scans", { count: code.scans })}
                </p>
              </div>

              <QRCodesRowActions
                codeId={code.id}
                url={code.url}
                label={code.label}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
