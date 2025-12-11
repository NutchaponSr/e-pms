"use client"

import * as React from "react";
import dynamic from "next/dynamic";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const ThemeProvider = dynamic(() => import("next-themes").then((mod) => mod.ThemeProvider), {
  ssr: false,
});

export function Providers({
  children,
  ...props
}: React.ComponentProps<typeof ThemeProvider>) {
  return (
    <ThemeProvider {...props}>
      <NuqsAdapter>
        {children}
      </NuqsAdapter>
    </ThemeProvider>
  );
}