import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "../../components/common/Button";
import { Input, Select } from "../../components/common/Input";
import { Skeleton, StatusBadge } from "../../components/common/Feedback";
import { adminCouponsApi } from "../../services/resources";
import { unwrapList } from "../../utils/unwrapList";

const emptyForm = { code: "", discount_type: "PERCENTAGE", value: "", min_order_amount: "0", max_uses: "" };

export default function AdminCoupons() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => adminCouponsApi.list().then((r) => r.data),
  });
  const coupons = unwrapList(raw);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });

  const handleCreate = async () => {
    await adminCouponsApi.create({
      ...form,
      max_uses: form.max_uses === "" ? null : Number(form.max_uses),
    });
    setForm(null);
    invalidate();
  };

  const handleToggle = async (coupon) => {
    await adminCouponsApi.update(coupon.id, { is_active: !coupon.is_active });
    invalidate();
  };

  const handleDelete = async (id) => {
    if (!confirm("?")) return;
    await adminCouponsApi.remove(id);
    invalidate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.coupons.title")}</h1>
        <Button onClick={() => setForm({ ...emptyForm })}>+ {t("admin.coupons.newCoupon")}</Button>
      </div>

      {form && (
        <div className="bg-bg-surface border border-border-subtle rounded-card p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label={t("admin.coupons.code")}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
          <Select
            label={t("admin.coupons.type")}
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
            options={[
              { value: "PERCENTAGE", label: t("admin.coupons.percentage") },
              { value: "FIXED", label: t("admin.coupons.fixed") },
            ]}
          />
          <Input
            label={t("admin.coupons.value")}
            type="number"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
          <Input
            label={t("admin.coupons.minOrderAmount")}
            type="number"
            value={form.min_order_amount}
            onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
          />
          <Input
            label={t("admin.coupons.maxUses")}
            type="number"
            value={form.max_uses}
            onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
          />
          <div className="col-span-full flex gap-3">
            <Button onClick={handleCreate}>{t("admin.coupons.save")}</Button>
            <Button variant="secondary" onClick={() => setForm(null)}>
              {t("admin.coupons.cancel")}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <table className="w-full text-sm">
          <thead className="text-text-muted border-b border-border-subtle">
            <tr>
              <th className="text-start py-2">{t("admin.coupons.code")}</th>
              <th className="text-start py-2">{t("admin.coupons.value")}</th>
              <th className="text-start py-2">{t("admin.coupons.used")}</th>
              <th className="text-start py-2"></th>
              <th className="text-start py-2"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-border-subtle last:border-0">
                <td className="py-3 font-mono">{c.code}</td>
                <td className="py-3">
                  {c.value} {c.discount_type === "PERCENTAGE" ? "%" : "USD"}
                </td>
                <td className="py-3 tabular-nums">
                  {c.times_used} / {c.max_uses ?? "∞"}
                </td>
                <td className="py-3">
                  <StatusBadge status={c.is_active ? "COMPLETED" : "CANCELLED"} />
                </td>
                <td className="py-3 text-end">
                  <button onClick={() => handleToggle(c)} className="text-accent-secondary text-xs me-3">
                    {c.is_active ? t("admin.coupons.deactivate") : t("admin.coupons.activate")}
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-accent-danger text-xs">
                    {t("admin.coupons.delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
