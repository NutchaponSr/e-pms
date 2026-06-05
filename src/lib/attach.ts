import "server-only";

import db from "@/lib/db";
import { extractFileNameFromUrl } from "@/lib/attach-utils";

import { Prisma } from "@/generated/prisma/client";

type DbClient = typeof db | Prisma.TransactionClient;

export { extractFileNameFromUrl } from "@/lib/attach-utils";

export async function upsertAttach(
  client: DbClient,
  url: string,
  createdBy: string,
) {
  return client.attach.upsert({
    where: { url },
    update: { fileName: extractFileNameFromUrl(url) },
    create: {
      url,
      fileName: extractFileNameFromUrl(url),
      createdBy,
    },
  });
}

export async function deleteAttachIfUnreferenced(client: DbClient, url: string) {
  const [kpiCount, cultureCount, competencyCount] = await Promise.all([
    client.kpiEvaluation.count({ where: { fileUrl: url } }),
    client.cultureEvaluation.count({ where: { fileUrl: url } }),
    client.competencyEvaluation.count({ where: { fileUrl: url } }),
  ]);

  if (kpiCount + cultureCount + competencyCount > 0) return;

  try {
    await client.attach.delete({ where: { url } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return;
    }
    throw error;
  }
}

export async function syncFileUrlAttach(
  client: DbClient,
  params: {
    oldFileUrl: string | null | undefined;
    newFileUrl: string | null | undefined;
    createdBy: string;
  },
) {
  const { oldFileUrl, newFileUrl, createdBy } = params;

  if (newFileUrl) {
    await upsertAttach(client, newFileUrl, createdBy);
  }

  if (oldFileUrl && oldFileUrl !== newFileUrl) {
    await deleteAttachIfUnreferenced(client, oldFileUrl);
  }
}

export function collectReplacedFileUrls(
  items: Array<{ id: string; fileUrl: string | null | undefined }>,
  oldUrlById: Map<string, string | null | undefined>,
): string[] {
  const urls = new Set<string>();

  for (const item of items) {
    const oldUrl = oldUrlById.get(item.id);
    if (oldUrl && oldUrl !== item.fileUrl) {
      urls.add(oldUrl);
    }
  }

  return [...urls];
}
