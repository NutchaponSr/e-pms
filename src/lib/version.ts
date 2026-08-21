import "server-only";

import { execFileSync } from "node:child_process";

export type AppVersion = {
  sha: string;
  shortSha: string;
  branch: string;
  message: string;
  committedAt: string;
  commitUrl: string;
  branchUrl: string;
};

function git(...args: string[]) {
  try {
    return execFileSync("git", args, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function githubRepoSlug() {
  const fromVercel = [
    process.env.VERCEL_GIT_REPO_OWNER,
    process.env.VERCEL_GIT_REPO_SLUG,
  ]
    .filter(Boolean)
    .join("/");

  if (fromVercel.includes("/")) {
    return fromVercel;
  }

  const remote = git("remote", "get-url", "origin");
  const match = remote.match(/github\.com[:/](.+?)(?:\.git)?$/i);
  return match?.[1] ?? "NutchaponSr/e-pms";
}

let cached: AppVersion | undefined;

export function getAppVersion(): AppVersion {
  if (process.env.NODE_ENV === "production" && cached) {
    return cached;
  }

  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT_SHA ||
    git("rev-parse", "HEAD");
  const rawBranch =
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.GIT_BRANCH ||
    git("rev-parse", "--abbrev-ref", "HEAD");
  const branch = !rawBranch || rawBranch === "HEAD" ? "" : rawBranch;
  const message =
    process.env.VERCEL_GIT_COMMIT_MESSAGE || git("log", "-1", "--pretty=%s");
  const committedAt = git("log", "-1", "--pretty=%cI");
  const repo = githubRepoSlug();
  const repoUrl = `https://github.com/${repo}`;

  const version: AppVersion = {
    sha,
    shortSha: sha.slice(0, 7),
    branch,
    message,
    committedAt,
    commitUrl: sha ? `${repoUrl}/commit/${sha}` : repoUrl,
    branchUrl: branch ? `${repoUrl}/tree/${encodeURIComponent(branch)}` : repoUrl,
  };

  cached = version;
  return version;
}
