import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import Button from "../components/common/Button";
import DynamicFieldRenderer from "../components/checkout/DynamicFieldRenderer";
import { useCart } from "../context/CartContext";
import { productsApi, ordersApi, couponsApi } from "../services/resources";
import { useQueries } from "@tanstack/react-query";

export default function Checkout() {
  const { t } = useTranslation();
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [values, setValues] = useState({}); // { cartItemId: { field_key: value } }
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState(null); // { valid, discount_amount, new_total }
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Fetch full product detail (with required_fields) for each distinct product in the cart.
  const productSlugs = [...new Set(cart.items?.map((i) => i.product_slug))];
  const productQueries = useQueries({
    queries: productSlugs.map((slug) => ({
      queryKey: ["product", slug],
      queryFn: () => productsApi.detail(slug).then((r) => r.data),
      enabled: !!slug,
    })),
  });

  const productBySlug = Object.fromEntries(
    productQueries.filter((q) => q.data).map((q) => [q.data.slug, q.data])
  );

  const handleFieldChange = (cartItemId, key, value) => {
    setValues((prev) => ({
      ...prev,
      [cartItemId]: { ...(prev[cartItemId] || {}), [key]: value },
    }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponChecking(true);
    setCouponError("");
    try {
      const { data } = await couponsApi.validate(couponCode.trim());
      setCouponResult(data);
    } catch (err) {
      setCouponResult(null);
      setCouponError(err.response?.data?.detail || "Invalid coupon.");
    } finally {
      setCouponChecking(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      const { data } = await ordersApi.create(values, couponResult?.valid ? couponCode.trim() : "");
      await refresh();
      navigate(`/account/orders/${data.order_number}`);
    } catch (err) {
      const detail = err.response?.data?.detail || "Could not place order. Check the required fields.";
      setErrors({ _global: detail });
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart.items?.length) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("checkout.title")}</h1>

      <div className="flex flex-col gap-6">
        {cart.items.map((item) => {
          const product = productBySlug[item.product_slug];
          return (
            <div key={item.id} className="bg-bg-surface border border-border-subtle rounded-card p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-xs text-text-muted">
                    {item.variant_name} × {item.quantity}
                  </p>
                </div>
                <span className="tabular-nums font-semibold">{item.subtotal}</span>
              </div>

              {product?.required_fields?.length > 0 && (
                <>
                  <p className="text-sm text-text-secondary mb-3">{t("checkout.requiredInfo")}</p>
                  <DynamicFieldRenderer
                    fields={product.required_fields}
                    values={values[item.id] || {}}
                    onChange={(key, value) => handleFieldChange(item.id, key, value)}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-card p-6 mt-6">
        <div className="flex gap-2 mb-4">
          <input
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value);
              setCouponResult(null);
              setCouponError("");
            }}
            placeholder="Coupon code"
            className="flex-1 bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm"
          />
          <Button variant="secondary" disabled={couponChecking} onClick={handleApplyCoupon}>
            Apply
          </Button>
        </div>
        {couponError && <p className="text-accent-danger text-sm mb-3">{couponError}</p>}
        {couponResult?.valid && (
          <p className="text-accent-success text-sm mb-3">
            Coupon applied — {couponResult.discount_amount} {cart.currency || ""} off
          </p>
        )}

        <div className="flex justify-between text-sm mb-1 text-text-secondary">
          <span>{t("common.subtotal")}</span>
          <span className="tabular-nums">{cart.subtotal}</span>
        </div>
        {couponResult?.valid && (
          <div className="flex justify-between text-sm mb-1 text-accent-success">
            <span>{t("common.discount")}</span>
            <span className="tabular-nums">-{couponResult.discount_amount}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg border-t border-border-subtle mt-2 pt-4 mb-4">
          <span>{t("common.total")}</span>
          <span className="tabular-nums">
            {couponResult?.valid ? couponResult.new_total : cart.subtotal}
          </span>
        </div>
        {errors._global && <p className="text-accent-danger text-sm mb-4">{errors._global}</p>}
        <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
          {t("checkout.placeOrder")}
        </Button>
      </div>
    </div>
  );
}
