"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";

type UseIntersectionObserverOptions = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
  onIntersect?: () => void;
};

function scrollParent(element: Element | null) {
  let current = element?.parentElement ?? null;
  while (current) {
    const overflowY = getComputedStyle(current).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return current;
    current = current.parentElement;
  }
  return null;
}

export function useIntersectionObserver({
  root,
  rootMargin = "0px",
  threshold = 0,
  enabled = true,
  onIntersect,
}: UseIntersectionObserverOptions = {}) {
  const [node, setNode] = useState<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const handleIntersect = useEffectEvent(() => {
    onIntersect?.();
  });

  const ref = useCallback((element: Element | null) => {
    setNode(element);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: handleIntersect is a useEffectEvent
  useEffect(() => {
    if (!enabled || !node || typeof IntersectionObserver === "undefined") {
      return;
    }

    let didHandle = false;
    const resolvedRoot = root === undefined ? scrollParent(node) : root;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry?.isIntersecting ?? false;
        setIsIntersecting(intersecting);
        if (!intersecting || didHandle) return;
        didHandle = true;
        observer.disconnect();
        handleIntersect();
      },
      { root: resolvedRoot, rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, node, root, rootMargin, threshold]);

  return {
    ref,
    isIntersecting: Boolean(enabled && node && isIntersecting),
  };
}
