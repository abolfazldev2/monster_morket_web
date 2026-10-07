import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "../../components/common/Button";
import { Skeleton, StatusBadge } from "../../components/common/Feedback";
import { adminFulfillmentApi } from "../../services/resources";

export default function AdminFulfillment() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "fulfillment"],
    queryFn: () => adminFulfillmentApi.list().then((r) => r.data.results || r.data),
  });

  const { data: detail } = useQuery({
    queryKey: ["admin", "fulfillment", expandedId],
    queryFn: () => adminFulfillmentApi.detail(expandedId).then((r) => r.data),
    enabled: !!expandedId,
  });

  const handleTransition = async (id, action) => {
    await adminFulfillmentApi.transition(id, action);
    queryClient.invalidateQueries({ queryKey: ["admin", "fulfillment"] });
  };

  const handleAddNote = async (id) => {
    if (!noteDraft.trim()) return;
    await adminFulfillmentApi.addNote(id, noteDraft);
    setNoteDraft("");
    queryClient.invalidateQueries({ queryKey: ["admin", "fulfillment", id] });
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("admin.fulfillment.title")}</h1>
      <div className="flex flex-col gap-3">
        {(data || []).map((f) => (
          <div key={f.id} className="bg-bg-surface border border-border-subtle rounded-card p-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
            >
              <div className="text-start">
                <p className="font-medium">
                  {f.order_number} — {f.product_name}
                </p>
                <p className="text-xs text-text-muted">{f.customer_username} · {f.delivery_method}</p>
              </div>
              <StatusBadge status={f.status} />
            </button>

            {expandedId === f.id && detail && (
              <div className="mt-4 pt-4 border-t border-border-subtle">
                {detail.steam_profile_url && (
                  <p className="text-sm text-text-secondary mb-2">
                    Steam: <span className="text-text-primary">{detail.steam_profile_url}</span>
                  </p>
                )}
                {detail.steam_trade_url && (
                  <p className="text-sm text-text-secondary mb-2">
                    Trade URL: <a href={detail.steam_trade_url} target="_blank" rel="noreferrer" className="text-accent-primary underline">{detail.steam_trade_url}</a>
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {detail.available_actions?.map((action) => (
                    <Button
                      key={action.action}
                      variant="secondary"
                      onClick={() => handleTransition(f.id, action.action)}
                      className="text-sm"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 mb-3">
                  {detail.notes?.map((n) => (
                    <p key={n.id} className="text-sm text-text-secondary">
                      <span className="text-text-primary">{n.author_name}:</span> {n.note}
                    </p>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder={t("admin.fulfillment.addNote")}
                    className="flex-1 bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm"
                  />
                  <Button variant="secondary" onClick={() => handleAddNote(f.id)}>
                    {t("admin.fulfillment.add")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
