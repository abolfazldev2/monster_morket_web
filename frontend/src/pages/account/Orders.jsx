import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { EmptyState, Skeleton, StatusBadge } from "../../components/common/Feedback";
import { ordersApi } from "../../services/resources";

export default function Orders() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.list().then((r) => r.data.results || r.data),
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data?.length) return <EmptyState title={t("orders.emptyTitle")} subtitle={t("orders.emptySubtitle")} />;

  return (
    <div className="flex flex-col gap-3">
      {data.map((order) => (
        <Link
          key={order.id}
          to={`/account/orders/${order.order_number}`}
          className="flex items-center justify-between bg-bg-surface border border-border-subtle rounded-card p-4 hover:border-accent-primary transition-colors"
        >
          <div>
            <p className="font-medium">{order.order_number}</p>
            <p className="text-xs text-text-muted">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="tabular-nums text-sm">
              {order.total} {order.currency}
            </span>
            <StatusBadge status={order.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
