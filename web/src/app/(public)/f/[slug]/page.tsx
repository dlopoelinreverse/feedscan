import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getRootUrl, getAppUrl } from "@/lib/domains";
import { PublicForm } from "@/components/public/public-form";
import type { PublicFormData, PublicQuestion, PublicFollowUpRule } from "@/components/public/types";
import { parseThemeConfig } from "@/lib/themes/parse";
import { PRESETS } from "@/lib/themes/presets";

interface PublicFormPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ qr?: string }>;
}

export default async function PublicFormPage({
  params,
  searchParams,
}: PublicFormPageProps) {
  const { slug } = await params;
  const { qr } = await searchParams;
  const t = await getTranslations("publicForm");

  const form = await prisma.form.findUnique({
    where: { slug },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { followUpRules: true },
      },
      theme: true,
    },
  });

  // Not found or not active → stylized 404
  if (!form || form.status !== "ACTIVE") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-bold">{t("formNotFound")}</h1>
          <p className="text-muted-foreground">
            {t("formNotFoundMessage")}
          </p>
          <Link
            href={getRootUrl()}
            className="inline-block px-6 py-2.5 rounded-lg bg-[#6C5CE7] text-white font-medium hover:bg-[#5A4BD5] transition-colors"
          >
            {t("formNotFoundAction")}
          </Link>
          <p className="text-xs text-muted-foreground pt-4">
            {t("viaBrand")}
          </p>
        </div>
      </div>
    );
  }

  // Find QR code by uniqueCode if provided
  let qrCodeId: string | null = null;
  if (qr) {
    const qrCode = await prisma.qRCode.findUnique({
      where: { uniqueCode: qr },
      select: { id: true, formId: true },
    });
    if (qrCode && qrCode.formId === form.id) {
      qrCodeId = qrCode.id;
    }
  }

  const themeConfig = form.theme
    ? parseThemeConfig(form.theme.config)
    : PRESETS.minimal;

  const publicData: PublicFormData = {
    id: form.id,
    title: form.title,
    description: form.description ?? null,
    rateLimitMode: form.rateLimitMode,
    rateLimitHours: form.rateLimitHours ?? null,
    theme: themeConfig,
    questions: form.questions.map(
      (q): PublicQuestion => ({
        id: q.id,
        type: q.type as "STARS" | "EMOJI" | "CHOICE" | "TEXT",
        label: q.label,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
        required: q.required,
        hasBranching: q.hasBranching,
        emojiLevels: detectEmojiLevels(q.followUpRules, q.type),
        multipleChoice: false, // not stored yet — default single
        placeholder: null,
        followUpRules: q.followUpRules.map(
          (r): PublicFollowUpRule => ({
            id: r.id,
            triggerType: r.triggerType as "LOW" | "HIGH",
            triggerMin: r.triggerMin,
            triggerMax: r.triggerMax,
            followUpLabel: r.followUpLabel,
            followUpOptions: Array.isArray(r.followUpOptions)
              ? (r.followUpOptions as string[])
              : [],
            allowFreeText: r.allowFreeText,
          })
        ),
      })
    ),
  };

  // Build API endpoint for CORS scenario (app subdomain) or same-origin (dev)
  const apiBase = getAppUrl("");

  return (
    <PublicForm form={publicData} qrCodeId={qrCodeId} apiBase={apiBase} />
  );
}

function detectEmojiLevels(
  rules: Array<{ triggerMin: number; triggerMax: number }>,
  type: string
): number | undefined {
  if (type !== "EMOJI") return undefined;
  // If any rule has triggerMax > 3, likely 5 levels
  const maxSeen = rules.reduce(
    (acc, r) => Math.max(acc, r.triggerMax),
    0
  );
  return maxSeen > 3 ? 5 : 3;
}
