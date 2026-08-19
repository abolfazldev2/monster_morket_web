import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Skeleton, StatusBadge } from "../../components/common/Feedback";
import api from "../../services/api";

export default function AdminOrders() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => api.get("/orders/").then((r) => r.data.results || r.data),
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("admin.orders.title")}</h1>
      <table className="w-full text-sm">
        <thead className="text-text-muted text-start border-b border-border-subtle">
          <tr>
            <th className="text-start py-2">{t("admin.orders.order")}</th>
            <th className="text-start py-2">{t("admin.orders.total")}</th>
            <th className="text-start py-2">{t("admin.orders.status")}</th>
            <th className="text-start py-2">{t("admin.orders.created")}</th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((order) => (
            <tr key={order.id} className="border-b border-border-subtle last:border-0">
              <td className="py-3">
                <Link to={`/admin/orders/${order.order_number}`} className="hover:text-accent-primary">
                  {order.order_number}
                </Link>
              </td>
              <td className="py-3 tabular-nums">
                {order.total} {order.currency}
              </td>
              <td className="py-3">
                <StatusBadge status={order.status} />
              </td>
              <td className="py-3 text-text-muted">{new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
