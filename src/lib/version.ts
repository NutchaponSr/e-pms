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

export type VersionCommit = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  committedAt: string;
  commitUrl: string;
};

export type VersionBranch = {
  name: string;
  isCurrent: boolean;
  url: string;
  commits: VersionCommit[];
};

export type VersionHistory = {
  repo: string;
  repoUrl: string;
  currentBranch: string;
  currentSha: string;
  branches: VersionBranch[];
};

const COMMIT_LIMIT = 40;

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

function parseCommits(log: string, repoUrl: string): VersionCommit[] {
  if (!log) return [];

  return log
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [sha, shortSha, message, committedAt, author] = line.split("\x1f");
      return {
        sha: sha ?? "",
        shortSha: shortSha ?? (sha ?? "").slice(0, 7),
        message: message ?? "",
        author: author ?? "",
        committedAt: committedAt ?? "",
        commitUrl: sha ? `${repoUrl}/commit/${sha}` : repoUrl,
      };
    });
}

function uniqueBranchNames(raw: string) {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const name = line.replace(/^origin\//, "").trim();
    if (!name || name === "HEAD" || name === "origin" || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }

  return names;
}

function getHistoryFromGit(): VersionHistory | null {
  const version = getAppVersion();
  const repo = githubRepoSlug();
  const repoUrl = `https://github.com/${repo}`;
  const refs = git(
    "for-each-ref",
    "--sort=-committerdate",
    "refs/heads/",
    "refs/remotes/origin/",
    "--format=%(refname:short)",
  );

  if (!refs) return null;

  const names = uniqueBranchNames(refs);
  if (names.length === 0) return null;

  const branches: VersionBranch[] = names.map((name) => {
    const log = git(
      "log",
      name,
      `--max-count=${COMMIT_LIMIT}`,
      "--pretty=format:%H%x1f%h%x1f%s%x1f%cI%x1f%an",
    );

    return {
      name,
      isCurrent: name === version.branch,
      url: `${repoUrl}/tree/${encodeURIComponent(name)}`,
      commits: parseCommits(log, repoUrl),
    };
  });

  branches.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));

  return {
    repo,
    repoUrl,
    currentBranch: version.branch,
    currentSha: version.sha,
    branches,
  };
}

async function getHistoryFromGithub(): Promise<VersionHistory | null> {
  const version = getAppVersion();
  const repo = githubRepoSlug();
  const repoUrl = `https://github.com/${repo}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "e-pms",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const branchesRes = await fetch(
    `https://api.github.com/repos/${repo}/branches?per_page=100`,
    { headers, next: { revalidate: 120 } },
  );

  if (!branchesRes.ok) return null;

  const branchPayloads = (await branchesRes.json()) as Array<{ name: string }>;
  const names = branchPayloads.map((branch) => branch.name);

  const branches = await Promise.all(
    names.map(async (name) => {
      const commitsRes = await fetch(
        `https://api.github.com/repos/${repo}/commits?sha=${encodeURIComponent(name)}&per_page=${COMMIT_LIMIT}`,
        { headers, next: { revalidate: 120 } },
      );

      const commitsPayload = commitsRes.ok
        ? ((await commitsRes.json()) as Array<{
            sha: string;
            html_url: string;
            commit: {
              message: string;
              author?: { name?: string; date?: string };
              committer?: { date?: string };
            };
          }>)
        : [];

      return {
        name,
        isCurrent: name === version.branch,
        url: `${repoUrl}/tree/${encodeURIComponent(name)}`,
        commits: commitsPayload.map((commit) => ({
          sha: commit.sha,
          shortSha: commit.sha.slice(0, 7),
          message: commit.commit.message.split("\n")[0] ?? "",
          author: commit.commit.author?.name ?? "",
          committedAt:
            commit.commit.author?.date ?? commit.commit.committer?.date ?? "",
          commitUrl: commit.html_url,
        })),
      } satisfies VersionBranch;
    }),
  );

  branches.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));

  return {
    repo,
    repoUrl,
    currentBranch: version.branch,
    currentSha: version.sha,
    branches,
  };
}

let historyCached: VersionHistory | undefined;

export async function getVersionHistory(): Promise<VersionHistory> {
  if (process.env.NODE_ENV === "production" && historyCached) {
    return historyCached;
  }

  const history =
    getHistoryFromGit() ??
    (await getHistoryFromGithub()) ?? {
      repo: githubRepoSlug(),
      repoUrl: `https://github.com/${githubRepoSlug()}`,
      currentBranch: "",
      currentSha: "",
      branches: [],
    };

  historyCached = history;
  return history;
}
