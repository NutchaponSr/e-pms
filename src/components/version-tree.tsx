"use client";

import { formatDistanceToNow } from "date-fns";
import { ChevronRightIcon, GitBranchIcon, GitCommitHorizontalIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VersionBranch, VersionCommit, VersionHistory } from "@/lib/version";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function relativeTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

function CommitNode({
  commit,
  isCurrent,
  isLast,
}: {
  commit: VersionCommit;
  isCurrent: boolean;
  isLast: boolean;
}) {
  return (
    <li className="relative flex min-w-0">
      <span
        className={cn(
          "absolute start-1.75 top-0 w-px bg-border",
          isLast ? "h-3.5" : "bottom-0",
        )}
        aria-hidden
      />
      <a
        href={commit.commitUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "relative flex min-w-0 flex-1 items-start gap-2 rounded-sm px-1.5 py-1.5 transition-colors hover:bg-primary/6",
          isCurrent && "bg-primary/6",
        )}
      >
        <GitCommitHorizontalIcon
          className={cn(
            "relative z-1 mt-0.5 size-3.5 shrink-0",
            isCurrent ? "text-primary" : "text-tertiary",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-secondary">
              {commit.shortSha}
            </span>
            {isCurrent ? (
              <span className="rounded-sm bg-primary/10 px-1 py-px text-[10px] font-medium text-primary">
                current
              </span>
            ) : null}
            {commit.committedAt ? (
              <span className="truncate text-[10px] text-tertiary">
                {relativeTime(commit.committedAt)}
              </span>
            ) : null}
          </span>
          <span className="block truncate text-xs text-primary">
            {commit.message || "No message"}
          </span>
        </span>
      </a>
    </li>
  );
}

function BranchNode({
  branch,
  currentSha,
}: {
  branch: VersionBranch;
  currentSha: string;
}) {
  return (
    <AccordionItem value={branch.name}>
      <AccordionTrigger className="flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1.5 text-left hover:bg-primary/6 [&[data-state=open]>svg]:rotate-90">
        <ChevronRightIcon className="size-3.5 shrink-0 text-tertiary transition-transform" />
        <GitBranchIcon className="size-3.5 shrink-0 text-secondary" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">
          {branch.name}
        </span>
        {branch.isCurrent ? (
          <span className="rounded-sm bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary">
            current
          </span>
        ) : null}
        <span className="font-mono text-[10px] text-tertiary">
          {branch.commits.length}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-1">
        {branch.commits.length > 0 ? (
          <ul className="ms-4">
            {branch.commits.map((commit, index) => (
              <CommitNode
                key={`${branch.name}-${commit.sha}`}
                commit={commit}
                isCurrent={
                  currentSha.length > 0 &&
                  (commit.sha === currentSha ||
                    commit.shortSha === currentSha.slice(0, 7))
                }
                isLast={index === branch.commits.length - 1}
              />
            ))}
          </ul>
        ) : (
          <p className="ms-8 py-1 text-xs text-tertiary">No commits</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export function VersionTree({ history }: { history: VersionHistory }) {
  if (history.branches.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-tertiary">
        No version history found
      </p>
    );
  }

  const defaultOpen = history.branches
    .filter((branch) => branch.isCurrent)
    .map((branch) => branch.name);

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpen.length > 0 ? defaultOpen : [history.branches[0].name]}
      className="flex flex-col"
    >
      {history.branches.map((branch) => (
        <BranchNode
          key={branch.name}
          branch={branch}
          currentSha={history.currentSha}
        />
      ))}
    </Accordion>
  );
}
