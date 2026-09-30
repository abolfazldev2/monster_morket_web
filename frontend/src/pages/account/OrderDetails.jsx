import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { Skeleton } from "../../components/common/Feedback";
import OrderStatusTimeline from "../../components/orders/OrderStatusTimeline";
import { ordersApi } from "../../services/resources";

export default function OrderDetails() {
  const { t } = useTranslation();
  const { orderNumber } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => ordersApi.detail(orderNumber).then((r) => r.data),
    refetchInterval: 15000, // order status is the source of truth — poll while the tab is open
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (!order) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{order.order_number}</h1>
        <p className="text-text-secondary text-sm">
          {order.total} {order.currency}
        </p>
      </div>

      <OrderStatusTimeline status={order.status} />

      {order.payment?.status === "WAITING_FOR_PAYMENT" && (
        <div className="bg-bg-surface border border-accent-warn/40 rounded-card p-5">
          <p className="font-medium mb-1">{t("order.waitingForPayment")}</p>
          <p className="text-sm text-text-secondary mb-4">{t("order.paymentNotice")}</p>
          <a
            href={order.payment.telegram_app_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-accent-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-accent-primaryHover"
          >
            {t("order.contactTelegram")}
          </a>
          <a
            href={order.payment.telegram_contact_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-accent-primary underline ms-3"
          >
            {t("order.openTelegramWeb")}
          </a>
        </div>
      )}

      <div className="bg-bg-surface border border-border-subtle rounded-card p-5">
        <p className="font-medium mb-4">{t("order.items")}</p>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0">
            <div>
              <p>{item.product_name}</p>
              <p className="text-xs text-text-muted uppercase">{item.game}</p>
              {item.fulfillment && (
                <p className="text-xs text-text-secondary mt-1">
                  Fulfillment: {item.fulfillment.status.replaceAll("_", " ")}
                </p>
              )}
            </div>
            <span className="tabular-nums">{item.subtotal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
