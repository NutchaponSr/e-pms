import { getAppVersion } from "@/lib/version";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const version = getAppVersion();
  const versionLabel = [
    version.semver,
    version.branch,
    version.shortSha,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid grid-cols-[minmax(0,460px)] grid-rows-[min-content_min-content_auto] p-4 items-center justify-center min-w-80 min-h-dvh content-between">
      <div className="row-start-2 pb-9 pt-4 gap-5 flex flex-col justify-start box-border">
        {children}
      </div>
      <div className="row-start-3 mx-auto flex flex-col items-center gap-1 pb-1 text-center">
        {versionLabel ? (
          <p className="font-mono text-xs leading-5 text-secondary">{versionLabel}</p>
        ) : null}
        <small className="leading-5">Terms of Services and Privacy Policy</small>
      </div>
    </div>
  );
}