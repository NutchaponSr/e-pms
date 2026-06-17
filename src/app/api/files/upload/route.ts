import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/file-storage";

const MAX_SIZE_BYTES = 15 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const replaceUrl = formData.get("replaceUrl");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "PDF only" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File size must not exceed 15MB" }, { status: 400 });
  }

  const { url } = await saveUploadedFile(file, {
    replaceUrl: typeof replaceUrl === "string" ? replaceUrl : null,
  });

  return NextResponse.json({ url });
}
