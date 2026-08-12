import "server-only";

import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const FILES_API_PREFIX = "/api/files/";

export function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").trim();
  const stem = base.replace(/\.pdf$/i, "").trim() || "document";
  return `${stem.slice(0, 200)}.pdf`;
}

export function buildFileUrl(key: string): string {
  return `${FILES_API_PREFIX}${encodeURIComponent(key)}`;
}

async function resolveUniqueKey(fileName: string): Promise<string> {
  let candidate = fileName;
  let counter = 2;

  while (true) {
    try {
      await fs.access(getFilePath(candidate));
      const stem = fileName.replace(/\.pdf$/i, "");
      candidate = `${stem}-${counter}.pdf`;
      counter++;
    } catch {
      return candidate;
    }
  }
}

export async function saveUploadedFile(
  file: File,
  opts?: { replaceUrl?: string | null },
) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  if (opts?.replaceUrl) {
    await deleteFileByUrl(opts.replaceUrl);
  }

  const key = await resolveUniqueKey(sanitizeFileName(file.name));
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(getFilePath(key), buffer);

  return { url: buildFileUrl(key), key };
}

export function getFileKeyFromUrl(url: string): string | null {
  try {
    const pathname = url.startsWith("/")
      ? url.split("?")[0]
      : new URL(url).pathname;

    if (!pathname.startsWith(FILES_API_PREFIX)) return null;

    const rawKey = pathname.slice(FILES_API_PREFIX.length);
    if (!rawKey || rawKey.includes("/") || rawKey.includes("..")) return null;

    const key = decodeURIComponent(rawKey);
    if (key.includes("/") || key.includes("..")) return null;

    return key;
  } catch {
    return null;
  }
}

export async function deleteFileByKey(key: string) {
  try {
    await fs.unlink(getFilePath(key));
  } catch {
    // File may already be removed.
  }
}

export async function deleteFileByUrl(url: string) {
  const key = getFileKeyFromUrl(url);
  if (!key) return;

  await deleteFileByKey(key);
}

export function getFilePath(key: string) {
  return path.join(UPLOAD_DIR, path.basename(key));
}
