import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/common/Button";
import { CartItemRow } from "../components/cart/CartItemRow";
import { EmptyState } from "../components/common/Feedback";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { t } = useTranslation();
  const { cart, updateItem, removeItem } = useCart();
  const navigate = useNavigate();

  if (!cart.items?.length) {
    return (
      <EmptyState
        title={t("cart.emptyTitle")}
        subtitle={t("cart.emptySubtitle")}
        action={
          <Link to="/">
            <Button>{t("common.continueShopping")}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="bg-bg-surface border border-border-subtle rounded-card p-4">
        {cart.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onQuantityChange={updateItem}
            onRemove={removeItem}
          />
        ))}
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-card p-6 h-fit">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-secondary">{t("common.subtotal")}</span>
          <span className="tabular-nums">{cart.subtotal}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg border-t border-border-subtle mt-4 pt-4">
          <span>{t("common.total")}</span>
          <span className="tabular-nums">{cart.subtotal}</span>
        </div>
        <Button className="w-full mt-6" onClick={() => navigate("/checkout")}>
          {t("common.proceedToCheckout")}
        </Button>
        <Link to="/" className="block text-center text-sm text-text-secondary mt-3 hover:text-text-primary">
          {t("common.continueShopping")}
        </Link>
      </div>
    </div>
  );
}
