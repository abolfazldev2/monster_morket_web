import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";

import { Skeleton } from "../../components/common/Feedback";
import { adminAuditLogsApi } from "../../services/resources";
import { unwrapList } from "../../utils/unwrapList";

export default function AdminAuditLogs() {
  const { t } = useTranslation();
  const { data: raw, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => adminAuditLogsApi.list().then((r) => r.data),
  });
  const logs = unwrapList(raw);

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("admin.auditLogs.title")}</h1>
      <table className="w-full text-sm">
        <thead className="text-text-muted border-b border-border-subtle">
          <tr>
            <th className="text-start py-2">{t("admin.auditLogs.when")}</th>
            <th className="text-start py-2">{t("admin.auditLogs.admin")}</th>
            <th className="text-start py-2">{t("admin.auditLogs.action")}</th>
            <th className="text-start py-2">{t("admin.auditLogs.target")}</th>
            <th className="text-start py-2">{t("admin.auditLogs.change")}</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-border-subtle last:border-0 align-top">
              <td className="py-3 text-text-muted whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
              <td className="py-3">{log.username || "—"}</td>
              <td className="py-3">{log.action}</td>
              <td className="py-3 text-text-secondary">
                {log.target_model}#{log.target_id}
              </td>
              <td className="py-3 text-xs text-text-muted max-w-xs">
                {log.old_value && (
                  <div>
                    {t("admin.auditLogs.from")}: {JSON.stringify(log.old_value)}
                  </div>
                )}
                {log.new_value && (
                  <div>
                    {t("admin.auditLogs.to")}: {JSON.stringify(log.new_value)}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
