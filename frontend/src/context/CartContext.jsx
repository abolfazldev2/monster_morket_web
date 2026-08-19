import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { cartApi } from "../services/resources";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await cartApi.get();
      setCart(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (productId, variantId, quantity = 1) => {
    await cartApi.addItem({ product_id: productId, variant_id: variantId || undefined, quantity });
    await refresh();
  };

  const updateItem = async (itemId, quantity) => {
    await cartApi.updateItem(itemId, quantity);
    await refresh();
  };

  const removeItem = async (itemId) => {
    await cartApi.removeItem(itemId);
    await refresh();
  };

  const itemCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{ cart, isLoading, itemCount, refresh, addItem, updateItem, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
