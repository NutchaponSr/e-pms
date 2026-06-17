import fs from "fs/promises";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { deleteFileByKey, getFilePath } from "@/lib/file-storage";

type RouteContext = {
  params: Promise<{ key: string }>;
};

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return null;
  }
  return session;
}

export async function GET(req: Request, { params }: RouteContext) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
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
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: rawKey } = await params;
  await deleteFileByKey(decodeURIComponent(rawKey));

  return NextResponse.json({ success: true });
}
