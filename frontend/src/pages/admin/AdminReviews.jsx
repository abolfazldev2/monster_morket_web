import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";

import { Skeleton } from "../../components/common/Feedback";
import { adminReviewsApi } from "../../services/resources";
import { unwrapList } from "../../utils/unwrapList";

export default function AdminReviews() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: raw, isLoading } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => adminReviewsApi.list().then((r) => r.data),
  });
  const reviews = unwrapList(raw);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });

  const handleToggleApproval = async (review) => {
    await adminReviewsApi.update(review.id, { is_approved: !review.is_approved });
    invalidate();
  };

  const handleDelete = async (id) => {
    if (!confirm("?")) return;
    await adminReviewsApi.remove(id);
    invalidate();
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("admin.reviews.title")}</h1>
      <div className="flex flex-col gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="bg-bg-surface border border-border-subtle rounded-card p-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="font-medium text-sm">{r.username}</span>
                <span className="text-text-muted text-xs ms-2">
                  {t("admin.reviews.on")} {r.product_name}
                </span>
              </div>
              <span className="text-accent-warn text-sm">{"★".repeat(r.rating)}</span>
            </div>
            {r.comment && <p className="text-sm text-text-secondary mb-3">{r.comment}</p>}
            <div className="flex gap-3">
              <button onClick={() => handleToggleApproval(r)} className="text-xs text-accent-secondary">
                {r.is_approved ? t("admin.reviews.unapprove") : t("admin.reviews.approve")}
              </button>
              <button onClick={() => handleDelete(r.id)} className="text-xs text-accent-danger">
                {t("admin.reviews.delete")}
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-text-secondary text-sm">{t("admin.reviews.noReviews")}</p>}
      </div>
    </div>
  );
}
