import React from "react";

export function CartItemRow({ item, onQuantityChange, onRemove }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border-subtle last:border-0">
      <div className="w-16 h-16 bg-bg-surfaceAlt rounded-lg overflow-hidden shrink-0">
        {item.product_image && (
          <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted uppercase">{item.game}</p>
        <p className="font-medium truncate">{item.product_name}</p>
        {item.variant_name && <p className="text-xs text-text-secondary">{item.variant_name}</p>}
      </div>
      <input
        type="number"
        min={1}
        value={item.quantity}
        onChange={(e) => onQuantityChange(item.id, Number(e.target.value))}
        className="w-16 bg-bg-surface border border-border-subtle rounded-lg px-2 py-1 text-center"
      />
      <span className="w-24 text-end font-semibold tabular-nums">{item.subtotal}</span>
      <button onClick={() => onRemove(item.id)} className="text-text-muted hover:text-accent-danger">
        ✕
      </button>
    </div>
  );
}
