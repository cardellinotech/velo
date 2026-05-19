"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";
import { MonthNavigation } from "@/components/month/MonthNavigation";
import { MonthStats } from "@/components/month/MonthStats";
import { MonthlyGoals } from "@/components/month/MonthlyGoals";
import { MonthReviewDialog } from "@/components/month/MonthReviewDialog";

export default function MonthPage() {
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: goalsData } = useQuery({
    queryKey: queryKeys.monthlyGoals.byMonth(month),
    queryFn: () => api.monthlyGoals.get(month),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.monthStats.byMonth(month),
    queryFn: () => api.monthStats.get(month),
  });

  return (
    <div className="p-6 space-y-6">
      <MonthNavigation month={month} onMonthChange={setMonth} />
      <MonthStats stats={statsData} isLoading={statsLoading} />
      <MonthlyGoals month={month} onReviewClick={() => setReviewOpen(true)} />
      <MonthReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        month={month}
        record={goalsData ?? null}
      />
    </div>
  );
}
