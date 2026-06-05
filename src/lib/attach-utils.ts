export function extractFileNameFromUrl(url: string | null | undefined): string {
  if (!url) return "เอกสารแนบ";

  try {
    const parsed = new URL(url);
    const queryName = parsed.searchParams.get("filename");
    if (queryName) return queryName;

    const segment = decodeURIComponent(parsed.pathname.split("/").pop() ?? "");
    return segment || "เอกสารแนบ";
  } catch {
    const fallback = decodeURIComponent((url ?? "").split("?")[0].split("/").pop() ?? "");
    return fallback || "เอกสารแนบ";
  }
}

export function getEdgeStoreUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    return parsed.toString();
  } catch {
    return url.split("?")[0];
  }
}
