"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateUniqueCode } from "@/lib/utils";
import { getAbsoluteFormUrl } from "@/lib/domains";

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

async function assertFormOwnership(formId: string, userId: string) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { userId: true, slug: true },
  });
  if (!form || form.userId !== userId) {
    throw new Error("Form not found");
  }
  return form;
}

export interface QRCodeItem {
  id: string;
  label: string;
  uniqueCode: string;
  scans: number;
  url: string;
  createdAt: Date;
}

export async function listQRCodes(formId: string): Promise<QRCodeItem[]> {
  const userId = await getAuthUserId();
  const form = await assertFormOwnership(formId, userId);

  const codes = await prisma.qRCode.findMany({
    where: { formId },
    orderBy: { createdAt: "desc" },
  });

  return codes.map((c) => ({
    id: c.id,
    label: c.label,
    uniqueCode: c.uniqueCode,
    scans: c.scans,
    createdAt: c.createdAt,
    url: `${getAbsoluteFormUrl(form.slug)}?qr=${c.uniqueCode}`,
  }));
}

export async function createQRCode(
  formId: string,
  label: string
): Promise<QRCodeItem> {
  const userId = await getAuthUserId();
  const form = await assertFormOwnership(formId, userId);

  // Plan limit check
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (user?.plan === "FREE") {
    const count = await prisma.qRCode.count({ where: { formId } });
    if (count >= 1) {
      throw new Error("PLAN_LIMIT");
    }
  }

  if (!label.trim()) {
    throw new Error("LABEL_REQUIRED");
  }

  const qrCode = await prisma.qRCode.create({
    data: {
      formId,
      label: label.trim(),
      uniqueCode: generateUniqueCode(),
    },
  });

  revalidatePath(`/dashboard/forms/${formId}/qr-codes`);

  return {
    id: qrCode.id,
    label: qrCode.label,
    uniqueCode: qrCode.uniqueCode,
    scans: qrCode.scans,
    createdAt: qrCode.createdAt,
    url: `${getAbsoluteFormUrl(form.slug)}?qr=${qrCode.uniqueCode}`,
  };
}

export async function deleteQRCode(qrCodeId: string) {
  const userId = await getAuthUserId();

  const qrCode = await prisma.qRCode.findUnique({
    where: { id: qrCodeId },
    include: { form: { select: { userId: true } } },
  });

  if (!qrCode || qrCode.form.userId !== userId) {
    throw new Error("Not found");
  }

  const formId = qrCode.formId;
  await prisma.qRCode.delete({ where: { id: qrCodeId } });
  revalidatePath(`/dashboard/forms/${formId}/qr-codes`);
}
