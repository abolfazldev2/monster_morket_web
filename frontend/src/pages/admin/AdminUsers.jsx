import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";

import { Skeleton } from "../../components/common/Feedback";
import { adminUsersApi } from "../../services/resources";
import { unwrapList } from "../../utils/unwrapList";

const ROLES = ["CUSTOMER", "SUPPORT", "FULFILLMENT_ADMIN", "SUPER_ADMIN"];

export default function AdminUsers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: raw, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminUsersApi.list().then((r) => r.data),
  });
  const users = unwrapList(raw);

  const handleRoleChange = async (userId, role) => {
    await adminUsersApi.update(userId, { role });
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const handleToggleActive = async (user) => {
    await adminUsersApi.update(user.id, { is_active: !user.is_active });
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t("admin.users.title")}</h1>
      <p className="text-text-secondary text-sm mb-6">{t("admin.users.warning")}</p>
      <table className="w-full text-sm">
        <thead className="text-text-muted border-b border-border-subtle">
          <tr>
            <th className="text-start py-2">{t("admin.users.username")}</th>
            <th className="text-start py-2">{t("admin.users.email")}</th>
            <th className="text-start py-2">{t("admin.users.role")}</th>
            <th className="text-start py-2">{t("admin.users.active")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border-subtle last:border-0">
              <td className="py-3">{u.username}</td>
              <td className="py-3 text-text-secondary">{u.email}</td>
              <td className="py-3">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-2 py-1 text-xs"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3">
                <button onClick={() => handleToggleActive(u)} className="text-xs text-accent-secondary">
                  {u.is_active ? t("admin.users.suspend") : t("admin.users.reactivate")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
