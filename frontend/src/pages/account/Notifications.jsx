import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";

import { EmptyState, Skeleton } from "../../components/common/Feedback";
import { notificationsApi } from "../../services/resources";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list().then((r) => r.data.results || r.data),
  });

  const handleMarkRead = async (id) => {
    await notificationsApi.markRead(id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data?.length) return <EmptyState title="No notifications" subtitle="You're all caught up." />;

  return (
    <div className="flex flex-col gap-2">
      {data.map((n) => (
        <button
          key={n.id}
          onClick={() => !n.is_read && handleMarkRead(n.id)}
          className={`text-start bg-bg-surface border rounded-card p-4 ${
            n.is_read ? "border-border-subtle" : "border-accent-primary/40"
          }`}
        >
          <p className="font-medium">{n.title}</p>
          <p className="text-sm text-text-secondary">{n.message}</p>
          <p className="text-xs text-text-muted mt-1">{new Date(n.created_at).toLocaleString()}</p>
        </button>
      ))}
    </div>
  );
}
