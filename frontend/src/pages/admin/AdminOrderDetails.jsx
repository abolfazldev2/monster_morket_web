import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import Button from "../../components/common/Button";
import { Skeleton, StatusBadge } from "../../components/common/Feedback";
import { adminOrdersApi, adminPaymentsApi } from "../../services/resources";
import api from "../../services/api";

export default function AdminOrderDetails() {
  const { t } = useTranslation();
  const { orderNumber } = useParams();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [transactionReference, setTransactionReference] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "order", orderNumber],
    queryFn: () => api.get(`/orders/${orderNumber}/`).then((r) => r.data),
  });

  const handleConfirmPayment = async () => {
    setConfirming(true);
    setError("");
    try {
      if (!transactionReference.trim()) {
        setError(t("admin.orderDetails.transactionReferenceRequired"));
        return;
      }
      await adminPaymentsApi.confirm(order.payment.id, transactionReference.trim(), "Verified in Telegram");
      queryClient.invalidateQueries({ queryKey: ["admin", "order", orderNumber] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
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

  const handleCancelUnpaid = async () => {
    if (!window.confirm(t("admin.orderDetails.confirmCancelUnpaid"))) return;
    setConfirming(true);
    setError("");
    try {
      await adminOrdersApi.cancelUnpaid(orderNumber);
      await queryClient.invalidateQueries({ queryKey: ["admin", "order", orderNumber] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    } catch (err) {
      setError(err.response?.data?.detail || t("admin.orderDetails.couldNotCancel"));
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
            {order.payment?.transaction_reference && (
              <p className="text-xs text-text-muted mt-1">
                {t("admin.orderDetails.transactionReference")}: {order.payment.transaction_reference}
              </p>
            )}
          </div>
          {order.payment?.status === "WAITING_FOR_PAYMENT" && (
            <div className="flex flex-col items-end gap-2">
              <input
                value={transactionReference}
                onChange={(event) => setTransactionReference(event.target.value)}
                placeholder={t("admin.orderDetails.transactionReference")}
                className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button disabled={confirming} onClick={handleCancelUnpaid} variant="secondary">
                  {t("admin.orderDetails.cancelUnpaid")}
                </Button>
                <Button disabled={confirming || !transactionReference.trim()} onClick={handleConfirmPayment}>
                  {t("admin.orderDetails.confirmPayment")}
                </Button>
              </div>
            </div>
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
