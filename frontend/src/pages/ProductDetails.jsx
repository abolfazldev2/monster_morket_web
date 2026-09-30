import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../components/common/Button";
import { Skeleton } from "../components/common/Feedback";
import ReviewsSection from "../components/product/ReviewsSection";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { productsApi, wishlistApi } from "../services/resources";

export default function ProductDetails() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [variantId, setVariantId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [wishlisting, setWishlisting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productsApi.detail(slug).then((r) => r.data),
  });

  const handleWishlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setWishlisting(true);
    try {
      await wishlistApi.addItem(product.id);
      setWishlisted(true);
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    } finally {
      setWishlisting(false);
    }
  };

  if (isLoading) return <Skeleton className="h-96" />;
  if (!product) return null;

  const selectedVariant = product.variants?.find((v) => v.id === variantId);
  const displayPrice = selectedVariant?.price || product.base_price;

  const handleAdd = async (goToCheckout) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setAdding(true);
    try {
      await addItem(product.id, variantId, 1);
      navigate(goToCheckout ? "/checkout" : "/cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="aspect-video bg-bg-surface border border-border-subtle rounded-card overflow-hidden">
        {product.cover_image && (
          <img src={product.cover_image} alt={product.name} className="w-full h-full object-cover" />
        )}
      </div>

      <div>
        <p className="text-xs text-text-muted uppercase mb-1">
          {product.game} / {product.category}
        </p>
        <h1 className="text-2xl font-bold mb-4">{product.name}</h1>

        {product.variants?.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                className={`px-4 py-2 rounded-lg border text-sm ${
                  variantId === v.id
                    ? "border-accent-primary text-accent-primary"
                    : "border-border-subtle text-text-secondary"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        <p className="text-3xl font-bold tabular-nums mb-4">
          {displayPrice} {product.currency}
        </p>

        <dl className="grid grid-cols-2 gap-y-2 text-sm mb-6">
          <dt className="text-text-muted">{t("common.availability")}</dt>
          <dd>{product.in_stock ? t("common.available") : t("common.outOfStock")}</dd>
          <dt className="text-text-muted">{t("common.delivery")}</dt>
          <dd>{product.delivery_method?.replaceAll("_", " ")}</dd>
        </dl>

        <p className="text-text-secondary mb-6">{product.description}</p>

        <div className="flex gap-3">
          <Button variant="secondary" disabled={adding || !product.in_stock} onClick={() => handleAdd(false)}>
            {t("common.addToCart")}
          </Button>
          <Button disabled={adding || !product.in_stock} onClick={() => handleAdd(true)}>
            {t("common.buyNow")}
          </Button>
          <button
            onClick={handleWishlist}
            disabled={wishlisting}
            aria-label={t("common.wishlist")}
            className={`px-4 rounded-lg border transition-colors ${
              wishlisted ? "border-accent-primary text-accent-primary" : "border-border-subtle text-text-secondary hover:text-text-primary"
            }`}
          >
            {wishlisted ? "♥" : "♡"}
          </button>
        </div>

        {product.required_fields?.length > 0 && (
          <p className="text-xs text-text-muted mt-4">
          {t("product.requiredAtCheckout", { fields: product.required_fields.map((f) => f.label).join(", ") })}
          </p>
        )}
      </div>
    </div>
    <ReviewsSection productId={product.id} />
    </div>
  );
}
