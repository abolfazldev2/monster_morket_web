import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import Button from "../../components/common/Button";
import { Skeleton, StatusBadge } from "../../components/common/Feedback";
import { adminPaymentsApi } from "../../services/resources";
import api from "../../services/api";

export default function AdminOrderDetails() {
  const { t } = useTranslation();
  const { orderNumber } = useParams();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "order", orderNumber],
    queryFn: () => api.get(`/orders/${orderNumber}/`).then((r) => r.data),
  });

  const handleConfirmPayment = async () => {
    setConfirming(true);
    setError("");
    try {
      await adminPaymentsApi.confirm(order.payment.id, "Confirmed via admin dashboard");
      queryClient.invalidateQueries({ queryKey: ["admin", "order", orderNumber] });
    } catch (err) {
      if (err.response?.status === 401) {
        setError(t("admin.orderDetails.sessionExpired"));
      } else {
        setError(err.response?.data?.detail || t("admin.orderDetails.couldNotConfirm"));
      }
    } finally {
      setConfirming(false);
    }
  };

  if (isLoading) return <Skeleton className="h-64" />;
  if (!order) return null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{order.order_number}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-card p-5 mb-4">
        <p className="text-sm text-text-secondary mb-1">
          {t("admin.orderDetails.customer")}: {order.customer_username}
        </p>
        <p className="text-sm text-text-secondary mb-4">
          {t("admin.orderDetails.total")}: {order.total} {order.currency}
        </p>

        <div className="flex items-center justify-between border-t border-border-subtle pt-4">
          <div>
            <p className="text-sm">{t("admin.orderDetails.payment")}</p>
            <StatusBadge status={order.payment?.status} />
          </div>
          {order.payment?.status === "WAITING_FOR_PAYMENT" && (
            <Button disabled={confirming} onClick={handleConfirmPayment}>
              {t("admin.orderDetails.confirmPayment")}
            </Button>
          )}
        </div>
        {error && <p className="text-accent-danger text-sm mt-3">{error}</p>}
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-card p-5">
        <p className="font-medium mb-3">{t("admin.orderDetails.items")}</p>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between py-2 border-b border-border-subtle last:border-0">
            <span>{item.product_name}</span>
            <StatusBadge status={item.fulfillment?.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
