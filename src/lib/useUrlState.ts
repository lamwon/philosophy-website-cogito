"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface ThinkUrlState {
  step?: string;
  question?: string;
  philosopher?: string;
  wisdom?: string;
  mismatch?: string;
}

export function useThinkUrlState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state: ThinkUrlState = useMemo(() => ({
    step: searchParams.get("step") || undefined,
    question: searchParams.get("question") || undefined,
    philosopher: searchParams.get("philosopher") || undefined,
    wisdom: searchParams.get("wisdom") || undefined,
    mismatch: searchParams.get("mismatch") || undefined,
  }), [searchParams]);

  const updateUrl = useCallback((updates: Partial<ThinkUrlState>) => {
    const params = new URLSearchParams(searchParams.toString());
    let hasChanges = false;

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        if (params.get(key) !== value) {
          params.set(key, value);
          hasChanges = true;
        }
      } else {
        if (params.has(key)) {
          params.delete(key);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  const clearUrl = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return { state, updateUrl, clearUrl };
}
