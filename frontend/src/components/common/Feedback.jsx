import React from "react";

const STATUS_COLORS = {
  PENDING: "bg-text-muted/20 text-text-secondary",
  WAITING_FOR_PAYMENT: "bg-accent-warn/20 text-accent-warn",
  PAID: "bg-accent-secondary/20 text-accent-secondary",
  PROCESSING: "bg-accent-secondary/20 text-accent-secondary",
  STEAM_FRIEND_REQUESTED: "bg-accent-secondary/20 text-accent-secondary",
  WAITING_TRADE: "bg-accent-warn/20 text-accent-warn",
  DELIVERED: "bg-accent-success/20 text-accent-success",
  COMPLETED: "bg-accent-success/20 text-accent-success",
  CANCELLED: "bg-accent-danger/20 text-accent-danger",
  REFUNDED: "bg-accent-danger/20 text-accent-danger",
  PAYMENT_RECEIVED: "bg-accent-success/20 text-accent-success",
  FAILED: "bg-accent-danger/20 text-accent-danger",
};

export function StatusBadge({ status }) {
  const classes = STATUS_COLORS[status] || "bg-text-muted/20 text-text-secondary";
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${classes}`}>
      {status?.replaceAll("_", " ")}
    </span>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-card ${className}`} />;
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
      <p className="text-lg font-semibold text-text-primary">{title}</p>
      {subtitle && <p className="text-text-secondary max-w-sm">{subtitle}</p>}
      {action}
    </div>
  );
}
