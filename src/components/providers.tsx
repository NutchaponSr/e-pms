"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import { TRPCReactProvider } from "@/trpc/client";

export function Providers({
  children,
  ...props
}: React.ComponentProps<typeof ThemeProvider>) {
  return (
    <ThemeProvider {...props}>
      <NuqsAdapter>
        <TRPCReactProvider>
          {children}
        </TRPCReactProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
