import { useQuery } from "@tanstack/react-query";
import React from "react";

import { Skeleton } from "../../components/common/Feedback";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../services/resources";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["account-stats"],
    queryFn: () => authApi.stats().then((r) => r.data),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome, {user?.username}</h1>
      <p className="text-text-secondary mb-6">Here's a summary of your account.</p>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Orders" value={stats?.total_orders} />
          <StatCard label="Completed" value={stats?.completed_orders} />
          <StatCard label="Pending" value={stats?.pending_orders} />
          <StatCard label="Total Spent" value={`$${stats?.total_spent}`} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-card p-5">
      <p className="text-xs text-text-muted uppercase mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value ?? "—"}</p>
    </div>
  );
}
