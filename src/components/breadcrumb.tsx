"use client";

import React from "react";
import Link from "next/link";

import { HiSlash } from "react-icons/hi2";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

export const Breadcrumb = () => {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  const formatSlug = (slug: string) => {
    return slug
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");

    return {
      label: formatSlug(segment),
      href: path,
      isActive: index === segments.length - 1,
    }
  });

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
          <Button asChild size="xs" variant="ghost">
            <Link href={crumb.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          </Button>
        </React.Fragment>
      ))}
    </nav>
  )
}