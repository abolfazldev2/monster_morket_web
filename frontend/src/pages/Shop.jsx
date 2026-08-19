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

  useEffect(() => {
    if (mode === "search") setSearch(queryFromUrl);
  }, [mode, queryFromUrl]);

  const filters = { sort, search: search || undefined };
  if (mode === "best-sellers") filters.is_best_seller = true;
  if (mode !== "search" && gameSlug) filters.game = gameSlug;

  const { data: raw, isLoading } = useQuery({
    queryKey: ["products", mode, gameSlug, sort, search],
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
          : gameSlug || "Shop";

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
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : data.length ? (
        <ProductGrid products={data} />
      ) : (
        <EmptyState title="No products found" subtitle="Try a different search or check back soon." />
      )}
    </div>
  );
}
