import React from "react";

import { StatusBadge } from "../common/Feedback";

const ORDER_FLOW = ["PENDING", "WAITING_FOR_PAYMENT", "PAID", "PROCESSING", "COMPLETED"];

export default function OrderStatusTimeline({ status }) {
  const currentIndex = ORDER_FLOW.indexOf(status);
  const isTerminalNegative = status === "CANCELLED" || status === "REFUNDED";

  if (isTerminalNegative) {
    return <StatusBadge status={status} />;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {ORDER_FLOW.map((step, i) => (
        <React.Fragment key={step}>
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              i <= currentIndex
                ? "bg-accent-primary/20 text-accent-primary"
                : "bg-text-muted/10 text-text-muted"
            }`}
          >
            {step.replaceAll("_", " ")}
          </div>
          {i < ORDER_FLOW.length - 1 && (
            <div className={`h-px w-4 ${i < currentIndex ? "bg-accent-primary" : "bg-border-subtle"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
