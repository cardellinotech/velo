"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useActiveTimer() {
  return useQuery(api.timeEntries.getActive);
}
