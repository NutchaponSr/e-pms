import fs from "fs/promises";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { buildFileUrl, deleteFileByKey, getFilePath } from "@/lib/file-storage";
import { hasAnyRoleOnForm } from "@/modules/tasks/access";

type RouteContext = {
  params: Promise<{ key: string }>;
};

async function requireUsername() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  return user?.username ?? null;
}

async function hasFileAccess(key: string, username: string) {
  const url = buildFileUrl(key);

  const attach = await db.attach.findUnique({
    where: { url },
    include: {
      kpiEvaluations: { select: { formId: true } },
      competencyEvaluations: { select: { competencyRecord: { select: { meritFormId: true } } } },
      cultureEvaluations: { select: { cultureRecord: { select: { meritFormId: true } } } },
    },
  });

  if (!attach) return false;
  if (attach.createdBy === username) return true;

  const formIds = new Set([
    ...attach.kpiEvaluations.map((k) => k.formId),
    ...attach.competencyEvaluations.map((c) => c.competencyRecord.meritFormId),
    ...attach.cultureEvaluations.map((c) => c.cultureRecord.meritFormId),
  ]);

  for (const formId of formIds) {
    if (await hasAnyRoleOnForm(formId, username)) return true;
  }

  return false;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const username = await requireUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);

  if (!(await hasFileAccess(key, username))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filePath = getFilePath(key);

  try {
    const buffer = await fs.readFile(filePath);
    const contentDisposition = `inline; filename="${encodeURIComponent(key)}"`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const username = await requireUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);

  if (!(await hasFileAccess(key, username))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteFileByKey(key);

  return NextResponse.json({ success: true });
}
