import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "../../components/common/Button";
import { Input, Select } from "../../components/common/Input";
import { Skeleton, StatusBadge } from "../../components/common/Feedback";
import { adminGamesApi, adminProductsApi } from "../../services/resources";
import { unwrapList } from "../../utils/unwrapList";

const DELIVERY_METHODS = ["STEAM_GIFT", "STEAM_TRADE", "GAME_CODE", "MANUAL_ACTIVATION"];

const emptyForm = {
  id: null,
  game: "",
  category: "",
  name: "",
  slug: "",
  description: "",
  product_type: "item",
  base_price: "",
  stock: "",
  delivery_method: "STEAM_GIFT",
  is_active: true,
  seller_approved: false,
};

export default function AdminProducts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: productsRaw, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => adminProductsApi.list().then((r) => r.data),
  });
  const products = unwrapList(productsRaw);

  const { data: gamesRaw, isLoading: gamesLoading } = useQuery({
    queryKey: ["admin", "games"],
    queryFn: () => adminGamesApi.list().then((r) => r.data),
  });
  const games = unwrapList(gamesRaw);

  const selectedGame = games.find((g) => String(g.id) === String(form?.game));
  const categoryOptions = (selectedGame?.categories || []).map((c) => ({ value: c.id, label: c.name }));

  const openCreate = () => {
    setForm({ ...emptyForm });
    setFormError("");
  };
  const openEdit = (product) => {
    setForm({
      id: product.id,
      game: product.game,
      category: product.category,
      name: product.name,
      slug: product.slug,
      description: product.description,
      product_type: product.product_type,
      base_price: product.base_price,
      stock: product.stock ?? "",
      delivery_method: product.delivery_method,
      is_active: product.is_active,
      seller_approved: product.seller_approved,
    });
    setFormError("");
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.game || !form.category) {
      setFormError(t("admin.products.pickGameCategory"));
      return;
    }
    if (!form.name.trim() || !form.slug.trim() || !form.base_price) {
      setFormError(t("admin.products.requiredError"));
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      stock: form.stock === "" ? null : Number(form.stock),
      base_price: form.base_price,
    };
    try {
      if (form.id) {
        await adminProductsApi.update(form.id, payload);
      } else {
        await adminProductsApi.create(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      setForm(null);
    } catch (err) {
      const data = err.response?.data;
      setFormError(data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" · ") : "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("?")) return;
    await adminProductsApi.remove(id);
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.products.title")}</h1>
        <Button onClick={openCreate}>+ {t("admin.products.newProduct")}</Button>
      </div>

      {form && (
        <div className="bg-bg-surface border border-border-subtle rounded-card p-5 mb-6">
          <p className="font-medium mb-4">
            {form.id ? t("admin.products.editProduct") : t("admin.products.newProduct")}
          </p>

          {!gamesLoading && games.length === 0 && (
            <p className="text-accent-warn text-sm mb-4">{t("admin.products.noGames")}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t("admin.products.game")}
              value={form.game}
              onChange={(e) => setForm({ ...form, game: e.target.value, category: "" })}
              options={games.map((g) => ({ value: g.id, label: g.name }))}
            />
            <Select
              label={t("admin.products.category")}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={categoryOptions}
            />
            <Input
              label={t("admin.products.name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label={t("admin.products.slug")}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <Input
              label={t("admin.products.productType")}
              value={form.product_type}
              onChange={(e) => setForm({ ...form, product_type: e.target.value })}
            />
            <Select
              label={t("admin.products.deliveryMethod")}
              value={form.delivery_method}
              onChange={(e) => setForm({ ...form, delivery_method: e.target.value })}
              options={DELIVERY_METHODS.map((m) => ({ value: m, label: m }))}
            />
            <Input
              label={t("admin.products.basePrice")}
              type="number"
              step="0.01"
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value })}
            />
            <Input
              label={t("admin.products.stock")}
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <label className="block mt-4">
            <span className="block text-sm text-text-secondary mb-1">{t("admin.products.description")}</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm min-h-24"
            />
          </label>
          <label className="flex items-center gap-2 mt-4 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            {t("admin.products.active")}
          </label>
          {form.id && products.find((p) => p.id === form.id)?.seller && <label className="flex items-center gap-2 mt-3 text-sm">
            <input type="checkbox" checked={Boolean(form.seller_approved)} onChange={(e) => setForm({ ...form, seller_approved: e.target.checked, is_active: e.target.checked ? true : false })} />
            {t("admin.products.approveSellerListing")}
          </label>}
          <div className="flex gap-3 mt-5">
            <Button disabled={saving} onClick={handleSave}>
              {t("admin.products.save")}
            </Button>
            <Button variant="secondary" onClick={() => setForm(null)}>
              {t("admin.products.cancel")}
            </Button>
          </div>
          {formError && <p className="text-accent-danger text-sm mt-3">{formError}</p>}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <table className="w-full text-sm">
          <thead className="text-text-muted border-b border-border-subtle">
            <tr>
              <th className="text-start py-2">{t("admin.products.name")}</th>
              <th className="text-start py-2">{t("admin.products.game")}</th>
              <th className="text-start py-2">{t("market.title")}</th>
              <th className="text-start py-2">{t("admin.products.columnPrice")}</th>
              <th className="text-start py-2">{t("admin.products.columnStock")}</th>
              <th className="text-start py-2">{t("admin.products.columnStatus")}</th>
              <th className="text-start py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border-subtle last:border-0">
                <td className="py-3">{p.name}</td>
                <td className="py-3 text-text-secondary">{p.game_name}</td>
                <td className="py-3 text-text-secondary">{p.seller_name ? `${p.seller_name} · ${p.seller_approved ? t("admin.products.approved") : t("admin.products.pendingReview")}` : "—"}</td>
                <td className="py-3 tabular-nums">{p.base_price}</td>
                <td className="py-3 tabular-nums">{p.stock ?? "∞"}</td>
                <td className="py-3">
                  <StatusBadge status={p.is_active ? "COMPLETED" : "CANCELLED"} />
                </td>
                <td className="py-3 text-end">
                  <button onClick={() => openEdit(p)} className="text-accent-secondary text-xs me-3">
                    {t("admin.products.edit")}
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-accent-danger text-xs">
                    {t("admin.products.delete")}
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
