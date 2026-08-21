import { GitBranchIcon } from "lucide-react";

import { getAppVersion } from "@/lib/version";

export const VersionLog = () => {
  const version = getAppVersion();

  if (!version.shortSha && !version.branch) {
    return null;
  }

  return (
    <div className="flex flex-col items-start lg:items-end gap-1 min-w-0 w-full lg:w-auto lg:max-w-xs lg:shrink-0">
      <div className="flex items-center gap-2 text-xs text-secondary min-w-0 max-w-full">
        {version.branch ? (
          <a
            href={version.branchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-sm bg-primary/6 px-1.5 py-0.5 font-medium hover:bg-primary/10 transition-colors min-w-0 max-w-full"
          >
            <GitBranchIcon className="size-3 shrink-0" />
            <span className="truncate">{version.branch}</span>
          </a>
        ) : null}
        {version.shortSha ? (
          <a
            href={version.commitUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-tertiary hover:text-primary transition-colors shrink-0"
            title={version.sha}
          >
            {version.shortSha}
          </a>
        ) : null}
      </div>
      {version.message ? (
        <p className="hidden sm:block w-full text-[11px] leading-4 text-tertiary truncate lg:text-right">
          {version.message}
        </p>
      ) : null}
    </div>
  );
};
