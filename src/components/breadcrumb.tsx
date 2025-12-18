"use client";

import React from "react";
import Link from "next/link";

import { HiSlash } from "react-icons/hi2";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

// ตั้งค่า breadcrumb ได้จากตรงนี้
// - PATH_LABELS: เปลี่ยนชื่อ path ให้เป็นข้อความที่ต้องการ
// - HIDDEN_PATHS: ซ่อน path ไม่ให้แสดงใน breadcrumb (รองรับ regex)
// - DISABLED_PATHS: แสดงแต่กดไม่ได้ (ไม่เป็นลิงก์)
const PATH_LABELS: Record<string, string> = {
  // ตัวอย่าง:
  // "/performance": "Performance Management",
  // "/performance/kpi": "KPI",
};

// ใช้ regex เพื่อซ่อน path ตาม pattern ได้
const HIDDEN_PATHS: RegExp[] = [
  // ตัวอย่าง: ซ่อน path ที่เป็น KPI id รูปแบบ CUID ใต้ /performance/kpi/
  // CUID format: c + 24 ตัวอักษร base36 (รวมทั้งหมด 25 ตัวอักษร)
  /^\/performance\/kpi\/c[a-z0-9]{24}$/i,
];

const DISABLED_PATHS = new Set<string>([
  "/performance/kpi",
]);

type BreadcrumbItem = {
  label: string;
  href: string;
  isActive: boolean;
  isDisabled: boolean;
};

export const Breadcrumb = () => {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  const formatSlug = (slug: string) => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const breadcrumbs: BreadcrumbItem[] = segments
    .map((segment, index) => {
      const path = "/" + segments.slice(0, index + 1).join("/");

      if (HIDDEN_PATHS.some((pattern) => pattern.test(path))) {
        return null;
      }

      const label = PATH_LABELS[path] ?? formatSlug(segment);

      return {
        label,
        href: path,
        isActive: index === segments.length - 1,
        isDisabled: DISABLED_PATHS.has(path),
      };
    })
    .filter((item): item is BreadcrumbItem => item !== null);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center leading-[1.2] text-sm h-full grow-0 min-w-0 me-2">
      <Button asChild size="xs" variant="ghost">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Home
        </Link>
      </Button>

      {breadcrumbs.map((crumb) => (
        <React.Fragment key={crumb.href}>
          <span className="w-2 flex items-center justify-center m-0">
            <HiSlash className="size-5 text-[#494846] block shrink-0" />
          </span>
          {crumb.isDisabled || crumb.isActive ? (
            <span className="px-1 text-sm text-muted-foreground truncate max-w-40">
              {crumb.label}
            </span>
          ) : (
            <Button asChild size="xs" variant="ghost">
              <Link
                href={crumb.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            </Button>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}