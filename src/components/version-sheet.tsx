"use client";

import { GitBranchIcon } from "lucide-react";

import type { AppVersion, VersionHistory } from "@/lib/version";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VersionTree } from "@/components/version-tree";

interface Props {
  version: AppVersion;
  history: VersionHistory;
}

export const VersionLogSheet = ({ version, history }: Props) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex w-full min-w-0 cursor-pointer flex-col items-start gap-1 rounded-sm text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring lg:w-auto lg:max-w-xs lg:shrink-0 lg:items-end lg:text-right"
        >
          <span className="font-mono text-sm font-semibold leading-5 text-primary">
            {version.semver}
          </span>
          <span className="flex max-w-full min-w-0 items-center gap-2 text-xs text-secondary">
            {version.branch ? (
              <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm bg-primary/6 px-1.5 py-0.5 font-medium">
                <GitBranchIcon className="size-3 shrink-0" />
                <span className="truncate">{version.branch}</span>
              </span>
            ) : null}
            {version.shortSha ? (
              <span className="shrink-0 font-mono text-tertiary" title={version.sha}>
                {version.shortSha}
              </span>
            ) : null}
          </span>
          {version.message ? (
            <span className="hidden w-full truncate text-[11px] leading-4 text-tertiary sm:block">
              {version.message}
            </span>
          ) : null}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Version {version.semver}</SheetTitle>
          <SheetDescription className="truncate">
            {history.repo}
            {version.branch ? ` · ${version.branch}` : ""}
            {version.shortSha ? ` · ${version.shortSha}` : ""}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <VersionTree history={history} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
