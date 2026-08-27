"use client";

import { useEffect, useRef } from "react";
import { Models } from "appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { getAppwriteClient } from "@/lib/appwrite/client";

type RealtimePayload = {
  events: string[];
  payload: Models.Document & Record<string, unknown>;
};

function matchesFilters(payload: RealtimePayload, filters: string[]) {
  return filters.every((filter) => {
    const [field, expected] = filter.split("=");
    if (!field) return true;
    const value = payload.payload[field];
    if (value && typeof value === "object" && "$id" in value) {
      return String((value as { $id: string }).$id) === expected;
    }
    return String(value) === expected;
  });
}

/**
 * اشتراک Realtime روی یک collection اپ‌رایت با فیلتر ساده `field=value`.
 * SDK کلاینت Appwrite فیلتر سمت سرور ندارد، پس فیلتر در callback اعمال می‌شود.
 * روی unmount خودش unsubscribe می‌کند.
 */
export function useRealtime(
  collectionKey: keyof typeof appwriteConfig.collections,
  filters: string[],
  onChange: (payload: RealtimePayload) => void,
) {
  const handlerRef = useRef(onChange);

  useEffect(() => {
    handlerRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const collectionId = appwriteConfig.collections[collectionKey];
    if (!collectionId) return;

    const client = getAppwriteClient();
    const unsubscribe = client.subscribe(
      `databases.${appwriteConfig.databaseId}.collections.${collectionId}.documents`,
      (payload) => {
        const typed = payload as unknown as RealtimePayload;
        if (matchesFilters(typed, filters)) handlerRef.current(typed);
      },
    );

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionKey, ...filters]);
}

export type { RealtimePayload };
