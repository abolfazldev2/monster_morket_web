import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { gamesApi, sellerApi } from "../../services/resources";
import { unwrapList } from "../../utils/unwrapList";

const emptyForm = { game: "", category: "", name: "", description: "", base_price: "", wear: "", float_value: "", rarity: "", stickers: "", pattern_id: "", cover_image: null };

export default function SellerMarket() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const { data: games = [] } = useQuery({ queryKey: ["games"], queryFn: () => gamesApi.list().then((r) => r.data) });
  const { data: rawListings, isLoading: loadingListings } = useQuery({ queryKey: ["seller-listings"], queryFn: () => sellerApi.listings().then((r) => r.data) });
  const { data: rawSales, isLoading: loadingSales } = useQuery({ queryKey: ["seller-sales"], queryFn: () => sellerApi.sales().then((r) => r.data) });
  const listings = unwrapList(rawListings);
  const sales = unwrapList(rawSales);
  const selectedGame = games.find((game) => String(game.id) === String(form.game));
  const { data: selectedGameDetails } = useQuery({
    queryKey: ["game", selectedGame?.slug],
    queryFn: () => gamesApi.detail(selectedGame.slug).then((r) => r.data),
    enabled: Boolean(selectedGame?.slug),
  });
  const categories = selectedGameDetails?.categories || [];

  const saveMutation = useMutation({
    mutationFn: ({ id, body }) => id ? sellerApi.updateListing(id, body) : sellerApi.createListing(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
      setForm(emptyForm); setEditingId(null); setError(""); setNotice(t("market.submitted"));
    },
    onError: (err) => setError(err.response?.data?.detail || Object.values(err.response?.data || {}).flat().join(" ") || t("market.saveError")),
  });
  const removeMutation = useMutation({ mutationFn: sellerApi.removeListing, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller-listings"] }) });
  const deliveredMutation = useMutation({
    mutationFn: sellerApi.markDelivered,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller-sales"] }),
    onError: (err) => setError(err.response?.data?.detail || t("market.saveError")),
  });

  const editListing = (listing) => {
    setEditingId(listing.id);
    setNotice(""); setError("");
    setForm({ game: String(listing.game), category: String(listing.category), name: listing.name, description: listing.description || "", base_price: listing.base_price, wear: listing.wear || "", float_value: listing.float_value || "", rarity: listing.rarity || "", stickers: (listing.stickers || []).join(", "), pattern_id: listing.pattern_id || "", cover_image: null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = (event) => {
    event.preventDefault(); setError(""); setNotice("");
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "cover_image") { if (value) body.append(key, value); }
      else if (value !== "" && value !== null) body.append(key, value);
    });
    saveMutation.mutate({ id: editingId, body });
  };

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold">{t("market.title")}</h1>
        <p className="mt-2 text-sm text-text-secondary">{t("market.description")}</p>
        {(!user?.steam_id64 || !user?.steam_trade_url) && <p className="mt-3 text-sm text-accent-warn">{t("market.connectSteam")} <Link to="/account/settings" className="underline">{t("steam.goToSettings")}</Link></p>}
      </header>

      <section className="rounded-xl border border-border-subtle bg-bg-surface p-5">
        <h2 className="text-lg font-semibold mb-4">{editingId ? t("market.editListing") : t("market.newListing")}</h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">{t("market.game")}<select required value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value, category: "" })} className="mt-1 w-full bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2"><option value="">—</option>{games.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
          <label className="text-sm">{t("market.category")}<select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2"><option value="">—</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="text-sm">{t("market.itemName")}<input required maxLength={200} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2" /></label>
          <label className="text-sm">{t("market.price")} (USD)<input required type="number" min="0.01" step="0.01" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} className="mt-1 w-full bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2" /></label>
          <label className="text-sm">{t("market.wear")}<select value={form.wear} onChange={(e) => setForm({ ...form, wear: e.target.value })} className="mt-1 w-full bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2"><option value="">—</option>{["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"].map((wear) => <option key={wear}>{wear}</option>)}</select></label>
          <label className="text-sm">{t("market.float")}<input type="number" min="0" max="1" step="0.000001" value={form.float_value} onChange={(e) => setForm({ ...form, float_value: e.target.value })} className="mt-1 w-full bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2" /></label>
          <label className="text-sm">{t("market.rarity")}<input value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })} className="mt-1 w-full bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2" /></label>
          <label className="text-sm">{t("market.patternId")}<input type="number" min="0" value={form.pattern_id} onChange={(e) => setForm({ ...form, pattern_id: e.target.value })} className="mt-1 w-full bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2" /></label>
          <label className="text-sm">{t("market.stickers")}<input value={form.stickers} onChange={(e) => setForm({ ...form, stickers: e.target.value })} placeholder={t("market.stickersHint")} className="mt-1 w-full bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2" /></label>
          <label className="text-sm">{t("market.image")}<input type="file" accept="image/*" onChange={(e) => setForm({ ...form, cover_image: e.target.files?.[0] || null })} className="mt-1 block w-full text-sm" /></label>
          <label className="text-sm md:col-span-2">{t("market.descriptionField")}<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2" /></label>
          {error && <p role="alert" className="md:col-span-2 text-sm text-accent-danger">{error}</p>}
          {notice && <p className="md:col-span-2 text-sm text-accent-primary">{notice}</p>}
          <div className="md:col-span-2 flex gap-3"><Button type="submit" disabled={saveMutation.isPending || (!editingId && (!user?.steam_id64 || !user?.steam_trade_url))}>{saveMutation.isPending ? t("market.saving") : t("market.submit")}</Button>{editingId && <Button type="button" variant="secondary" onClick={() => { setForm(emptyForm); setEditingId(null); }}>{t("common.cancel")}</Button>}</div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">{t("market.myListings")}</h2>
        {loadingListings ? <p>{t("common.loading")}</p> : listings.length === 0 ? <p className="text-sm text-text-secondary">{t("market.noListings")}</p> : <div className="space-y-3">{listings.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4"><div><p className="font-medium">{item.name}</p><p className="text-sm text-text-secondary">{item.game_name} · {item.base_price} {item.currency} · {t(`market.status.${item.listing_status}`)}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => editListing(item)}>{t("common.edit")}</Button><Button variant="danger" onClick={() => removeMutation.mutate(item.id)}>{t("common.remove")}</Button></div></article>)}</div>}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">{t("market.sales")}</h2>
        <p className="mb-4 text-xs text-text-secondary">{t("market.payoutNote")}</p>
        {loadingSales ? <p>{t("common.loading")}</p> : sales.length === 0 ? <p className="text-sm text-text-secondary">{t("market.noSales")}</p> : <div className="space-y-3">{sales.map((sale) => <article key={sale.id} className="rounded-xl border border-border-subtle bg-bg-surface p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-medium">{sale.product_name}</p><p className="text-sm text-text-secondary">{sale.order_number} · {t("market.buyer")}: {sale.buyer_name}</p><p className="mt-2 text-xs text-text-secondary">SteamID: {sale.buyer_steam_id64 || "—"}</p>{sale.buyer_trade_url && <a className="text-xs text-accent-primary underline break-all" href={sale.buyer_trade_url} target="_blank" rel="noreferrer">{t("market.openTradeLink")}</a>}<p className="mt-1 text-xs">{t("market.deliveryStatus")}: {sale.fulfillment_status}</p></div>{sale.fulfillment_status === "WAITING_TRADE" && <Button onClick={() => deliveredMutation.mutate(sale.id)} disabled={deliveredMutation.isPending}>{t("market.markDelivered")}</Button>}</div></article>)}</div>}
      </section>
    </div>
  );
}
