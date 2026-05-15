"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { PRESETS } from "@/lib/themes/presets";
import { parseThemeConfig } from "@/lib/themes/parse";
import type {
  ThemeConfig,
  ThemePresetId,
  ThemeRecord,
} from "@/lib/themes/types";

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function ensureDefaultTheme(
  userId: string,
  presetId: ThemePresetId = "minimal"
): Promise<{ id: string; config: ThemeConfig }> {
  const existing = await prisma.theme.findFirst({
    where: { userId, isDefault: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) {
    return { id: existing.id, config: parseThemeConfig(existing.config) };
  }

  const any = await prisma.theme.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (any) {
    const updated = await prisma.theme.update({
      where: { id: any.id },
      data: { isDefault: true },
    });
    return { id: updated.id, config: parseThemeConfig(updated.config) };
  }

  const config = PRESETS[presetId] ?? PRESETS.minimal;
  const created = await prisma.theme.create({
    data: {
      userId,
      name: "Mon premier thème",
      config: config as unknown as object,
      isDefault: true,
    },
  });
  return { id: created.id, config: parseThemeConfig(created.config) };
}

export async function listThemes(): Promise<
  Array<ThemeRecord & { formCount: number }>
> {
  const userId = await getAuthUserId();
  await ensureDefaultTheme(userId);

  const themes = await prisma.theme.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { forms: true } } },
  });

  return themes.map((t) => ({
    id: t.id,
    name: t.name,
    isDefault: t.isDefault,
    config: parseThemeConfig(t.config),
    formCount: t._count.forms,
  }));
}

export async function createTheme(input: {
  name: string;
  config: ThemeConfig;
  setDefault?: boolean;
}): Promise<ThemeRecord> {
  const userId = await getAuthUserId();
  await ensureDefaultTheme(userId);

  const created = await prisma.$transaction(async (tx) => {
    if (input.setDefault) {
      await tx.theme.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.theme.create({
      data: {
        userId,
        name: input.name.trim() || "Thème",
        config: input.config as unknown as object,
        isDefault: input.setDefault ?? false,
      },
    });
  });

  return {
    id: created.id,
    name: created.name,
    isDefault: created.isDefault,
    config: parseThemeConfig(created.config),
  };
}

export async function updateTheme(input: {
  id: string;
  name?: string;
  config?: ThemeConfig;
}): Promise<ThemeRecord> {
  const userId = await getAuthUserId();

  const existing = await prisma.theme.findUnique({ where: { id: input.id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Theme not found");
  }

  const updated = await prisma.theme.update({
    where: { id: input.id },
    data: {
      name: input.name?.trim() || existing.name,
      config:
        input.config !== undefined
          ? (input.config as unknown as object)
          : (existing.config as unknown as object),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    isDefault: updated.isDefault,
    config: parseThemeConfig(updated.config),
  };
}

export async function setDefaultTheme(id: string): Promise<void> {
  const userId = await getAuthUserId();
  const existing = await prisma.theme.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Theme not found");
  }
  await prisma.$transaction([
    prisma.theme.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.theme.update({ where: { id }, data: { isDefault: true } }),
  ]);
}

export async function renameTheme(id: string, name: string): Promise<void> {
  const userId = await getAuthUserId();
  const existing = await prisma.theme.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Theme not found");
  }
  await prisma.theme.update({
    where: { id },
    data: { name: name.trim() || existing.name },
  });
}

export async function duplicateTheme(
  id: string,
  newName?: string
): Promise<ThemeRecord> {
  const userId = await getAuthUserId();
  const existing = await prisma.theme.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Theme not found");
  }
  const created = await prisma.theme.create({
    data: {
      userId,
      name: newName?.trim() || `${existing.name} (copie)`,
      config: existing.config as unknown as object,
      isDefault: false,
    },
  });
  return {
    id: created.id,
    name: created.name,
    isDefault: created.isDefault,
    config: parseThemeConfig(created.config),
  };
}

export async function deleteTheme(id: string): Promise<void> {
  const userId = await getAuthUserId();
  const existing = await prisma.theme.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Theme not found");
  }

  const totalThemes = await prisma.theme.count({ where: { userId } });
  if (totalThemes <= 1) {
    throw new Error("LAST_THEME");
  }

  await prisma.$transaction(async (tx) => {
    const defaultTheme = await tx.theme.findFirst({
      where: { userId, isDefault: true, NOT: { id } },
      orderBy: { createdAt: "asc" },
    });
    let fallbackId = defaultTheme?.id;
    if (!fallbackId) {
      const any = await tx.theme.findFirst({
        where: { userId, NOT: { id } },
        orderBy: { createdAt: "asc" },
      });
      fallbackId = any?.id;
      if (fallbackId) {
        await tx.theme.update({
          where: { id: fallbackId },
          data: { isDefault: true },
        });
      }
    }
    await tx.form.updateMany({
      where: { themeId: id },
      data: { themeId: fallbackId ?? null },
    });
    await tx.theme.delete({ where: { id } });
  });
}

export async function applyThemeToForm(
  formId: string,
  themeId: string
): Promise<void> {
  const userId = await getAuthUserId();

  const [form, theme] = await Promise.all([
    prisma.form.findUnique({ where: { id: formId }, select: { userId: true } }),
    prisma.theme.findUnique({ where: { id: themeId }, select: { userId: true } }),
  ]);
  if (!form || form.userId !== userId) throw new Error("Form not found");
  if (!theme || theme.userId !== userId) throw new Error("Theme not found");

  await prisma.form.update({
    where: { id: formId },
    data: { themeId },
  });
}

export async function createThemeFromPreset(
  presetId: ThemePresetId,
  name: string
): Promise<ThemeRecord> {
  const config = PRESETS[presetId];
  return createTheme({ name, config });
}
