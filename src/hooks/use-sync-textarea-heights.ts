import * as React from "react";

interface TextareaGroup {
  refs: React.RefObject<HTMLTextAreaElement | null>[];
  breakpoint: string;
}

/**
 * Hook สำหรับ sync ความสูงของ textareas หลายๆ ตัว
 * เมื่ออยู่ใน breakpoint ที่กำหนดจะ sync ความสูงให้เท่ากัน (ใช้ค่าสูงสุด)
 * เมื่อไม่อยู่ใน breakpoint แต่ละ textarea จะ auto-resize ตามเนื้อหาของตัวเอง
 */
export const useSyncTextareaHeights = (groups: TextareaGroup[]) => {
  // Helper function to auto-resize a single textarea
  const autoResizeTextarea = React.useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Check media query
  const checkMediaQuery = React.useCallback((breakpoint: string) => {
    return typeof window !== "undefined" && window.matchMedia?.(breakpoint).matches;
  }, []);

  // Sync heights for a group of textareas
  const syncGroupHeights = React.useCallback((group: TextareaGroup) => {
    const textareas = group.refs
      .map((ref) => ref.current)
      .filter(Boolean) as HTMLTextAreaElement[];

    if (textareas.length === 0) return;

    const isBreakpointActive = checkMediaQuery(group.breakpoint);

    if (!isBreakpointActive) {
      textareas.forEach(autoResizeTextarea);
      return;
    }

    // Reset height first so scrollHeight is accurate, then set all to max
    textareas.forEach((el) => (el.style.height = "0px"));
    const maxHeight = Math.max(...textareas.map((el) => el.scrollHeight));
    textareas.forEach((el) => (el.style.height = `${maxHeight}px`));
  }, [checkMediaQuery, autoResizeTextarea]);

  // Sync all groups
  const syncAllGroups = React.useCallback(() => {
    groups.forEach(syncGroupHeights);
  }, [groups, syncGroupHeights]);

  // Setup event listeners for textarea height synchronization
  React.useEffect(() => {
    syncAllGroups();

    const mediaQueries = groups.map((group) => ({
      mq: window.matchMedia?.(group.breakpoint),
      group,
    })).filter((item) => item.mq);

    const handleMediaQueryChange = (group: TextareaGroup) => () => {
      syncGroupHeights(group);
    };

    const handleResize = () => {
      syncAllGroups();
    };

    mediaQueries.forEach(({ mq, group }) => {
      mq?.addEventListener?.("change", handleMediaQueryChange(group));
    });
    window.addEventListener("resize", handleResize);

    return () => {
      mediaQueries.forEach(({ mq, group }) => {
        mq?.removeEventListener?.("change", handleMediaQueryChange(group));
      });
      window.removeEventListener("resize", handleResize);
    };
  }, [syncAllGroups, syncGroupHeights, groups]);

  // Create sync functions for each group
  const groupSyncFunctions = React.useMemo(
    () => groups.map((group) => () => syncGroupHeights(group)),
    [groups, syncGroupHeights]
  );

  return {
    syncAllGroups,
    syncGroupHeights,
    groupSyncFunctions,
  };
};

