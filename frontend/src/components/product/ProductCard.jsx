import { motion } from "framer-motion";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

function handleSpotlight(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
}

export function ProductCard({ product, index = 0 }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/product/${product.slug}`}
        onMouseMove={handleSpotlight}
        className="spotlight-card monster-cut-sm group block bg-bg-surface border border-border-subtle overflow-hidden hover:border-accent-primary/60 transition-colors duration-200 hover:shadow-glow"
      >
        <div className="aspect-video bg-bg-surfaceAlt overflow-hidden relative">
          {product.cover_image ? (
            <img
              src={product.cover_image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted text-xs font-display tracking-widest uppercase">
              {product.game}
            </div>
          )}
          {product.is_best_seller && (
            <span className="absolute top-2 start-2 bg-accent-primary text-white text-[10px] font-display font-semibold tracking-wide uppercase px-2 py-1 rounded">
              Best Seller
            </span>
          )}
        </div>
        <div className="p-4 relative">
          <p className="text-xs text-text-muted uppercase font-display tracking-wider mb-1">{product.game}</p>
          <p className="font-medium text-text-primary truncate">{product.name}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="font-display font-semibold text-lg tabular-nums text-accent-primary">
              {product.base_price} <span className="text-xs text-text-muted">{product.currency}</span>
            </span>
            {!product.in_stock && (
              <span className="text-xs text-accent-danger">{t("common.outOfStock")}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
