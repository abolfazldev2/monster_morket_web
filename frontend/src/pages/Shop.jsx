import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";

import { ProductGrid } from "../components/product/ProductCard";
import { Skeleton, EmptyState } from "../components/common/Feedback";
import { productsApi } from "../services/resources";
import { unwrapList } from "../utils/unwrapList";

/**
 * mode: undefined (normal game shop via :gameSlug), "best-sellers", "offers", "search"
 */
export default function Shop({ mode }) {
  const { t } = useTranslation();
  const { gameSlug } = useParams();
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";

  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState(mode === "search" ? queryFromUrl : "");
  const [advanced, setAdvanced] = useState({ min_price: "", max_price: "", wear: "", rarity: "", min_float: "", max_float: "", sticker: "", pattern_id: "" });

  useEffect(() => {
    if (mode === "search") setSearch(queryFromUrl);
  }, [mode, queryFromUrl]);

  const filters = {
    sort,
    search: search || undefined,
    ...Object.fromEntries(Object.entries(advanced).map(([key, value]) => [key, value || undefined])),
  };
  if (mode === "best-sellers") filters.is_best_seller = true;
  if (mode !== "search" && gameSlug) filters.game = gameSlug;

  const { data: raw, isLoading } = useQuery({
    queryKey: ["products", mode, gameSlug, sort, search, advanced],
    queryFn: () => productsApi.list(filters).then((r) => r.data),
  });
  const data = unwrapList(raw);

  const title =
    mode === "best-sellers"
      ? t("home.bestSellers")
      : mode === "offers"
        ? t("nav.offers")
        : mode === "search"
          ? `${t("nav.search")}: ${queryFromUrl}`
          : gameSlug
            ? t(`nav.${gameSlug}`, { defaultValue: gameSlug })
            : t("nav.shop");

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold capitalize">{title}</h1>
        <div className="flex gap-3">
          {mode !== "search" && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("nav.search") + "..."}
              className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm"
            />
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm"
          >
            <option value="newest">{t("shop.sortNewest")}</option>
            <option value="price_asc">{t("shop.sortPriceAsc")}</option>
            <option value="price_desc">{t("shop.sortPriceDesc")}</option>
          </select>
        </div>
      </div>

      <details className="mb-6 rounded-xl border border-border-subtle bg-bg-surface p-4">
        <summary className="cursor-pointer text-sm font-medium">{t("shop.itemFilters")}</summary>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <input type="number" min="0" value={advanced.min_price} onChange={(e) => setAdvanced({ ...advanced, min_price: e.target.value })} placeholder={t("shop.minPrice")} className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm" />
          <input type="number" min="0" value={advanced.max_price} onChange={(e) => setAdvanced({ ...advanced, max_price: e.target.value })} placeholder={t("shop.maxPrice")} className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm" />
          <select value={advanced.wear} onChange={(e) => setAdvanced({ ...advanced, wear: e.target.value })} className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm">
            <option value="">{t("shop.anyWear")}</option>
            {["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"].map((wear) => <option key={wear} value={wear}>{t(`shop.wear.${wear}`, { defaultValue: wear })}</option>)}
          </select>
          <input value={advanced.rarity} onChange={(e) => setAdvanced({ ...advanced, rarity: e.target.value })} placeholder={t("shop.rarity")} className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm" />
          <input type="number" min="0" max="1" step="0.000001" value={advanced.min_float} onChange={(e) => setAdvanced({ ...advanced, min_float: e.target.value })} placeholder={t("shop.minFloat")} className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm" />
          <input type="number" min="0" max="1" step="0.000001" value={advanced.max_float} onChange={(e) => setAdvanced({ ...advanced, max_float: e.target.value })} placeholder={t("shop.maxFloat")} className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm" />
          <input value={advanced.sticker} onChange={(e) => setAdvanced({ ...advanced, sticker: e.target.value })} placeholder={t("shop.sticker")} className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm" />
          <input type="number" min="0" value={advanced.pattern_id} onChange={(e) => setAdvanced({ ...advanced, pattern_id: e.target.value })} placeholder={t("shop.patternId")} className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm" />
          <button type="button" onClick={() => setAdvanced({ min_price: "", max_price: "", wear: "", rarity: "", min_float: "", max_float: "", sticker: "", pattern_id: "" })} className="text-sm text-accent-primary">{t("shop.clearFilters")}</button>
        </div>
      </details>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : data.length ? (
        <ProductGrid products={data} />
      ) : (
        <EmptyState title={t("shop.noProducts")} subtitle={t("shop.noProductsHint")} />
      )}
    </div>
  );
}
