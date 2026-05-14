"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";

export function useActiveTimer() {
  return useQuery({
    queryKey: queryKeys.timeEntries.active(),
    queryFn: () => api.timeEntries.getActive(),
    refetchInterval: 5_000,
  });
}
