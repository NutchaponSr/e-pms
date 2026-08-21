import { getAppVersion, getVersionHistory } from "@/lib/version";

import { VersionLogSheet } from "@/components/version-sheet";

export const VersionLog = async () => {
  const version = getAppVersion();
  const history = await getVersionHistory();

  if (!version.shortSha && !version.branch) {
    return null;
  }

  return <VersionLogSheet version={version} history={history} />;
};
