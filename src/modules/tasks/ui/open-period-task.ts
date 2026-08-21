import { toast } from "sonner";

import {
  type ClientWindowInfo,
  isWindowActive,
  windowClosedMessage,
} from "@/modules/tasks/window-utils";

export function openPeriodTask({
  window,
  windowLabel,
  blockedMessage,
  href,
  onCreate,
  push,
}: {
  window: ClientWindowInfo | null | undefined;
  windowLabel: string;
  blockedMessage?: string;
  href?: string;
  onCreate: () => void;
  push: (href: string) => void;
}) {
  if (!isWindowActive(window)) {
    toast.error(windowClosedMessage(windowLabel, window));
    return;
  }

  if (blockedMessage) {
    toast.error(blockedMessage);
    return;
  }

  if (href) {
    push(href);
    return;
  }

  onCreate();
}
