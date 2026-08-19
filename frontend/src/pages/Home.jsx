import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ProductGrid } from "../components/product/ProductCard";
import { Skeleton } from "../components/common/Feedback";
import Button from "../components/common/Button";
import { gamesApi, productsApi } from "../services/resources";
import { unwrapList } from "../utils/unwrapList";

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const WHY_US = [
  { icon: "🛡️", key: "secure" },
  { icon: "⚡", key: "fast" },
  { icon: "✅", key: "trusted" },
  { icon: "🎮", key: "multi" },
];

export default function Home() {
  const { t } = useTranslation();

  const { data: gamesRaw } = useQuery({ queryKey: ["games"], queryFn: () => gamesApi.list().then((r) => r.data) });
  const games = unwrapList(gamesRaw);

  const { data: bestSellersRaw, isLoading } = useQuery({
    queryKey: ["products", "best-sellers"],
    queryFn: () => productsApi.list({ is_best_seller: true }).then((r) => r.data),
  });
  const bestSellers = unwrapList(bestSellersRaw);

  return (
    <div className="flex flex-col gap-20">
      {/* ---- Hero: animated grid backdrop + drifting glow orbs + staggered reveal ---- */}
      <section className="relative -mx-4 px-4 py-24 md:py-32 overflow-hidden text-center">
        <div className="grid-backdrop" />
        <div
          className="glow-orb w-72 h-72 bg-accent-primary/30 -top-10 start-1/4 animate-float"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="glow-orb w-80 h-80 bg-accent-secondary/20 top-10 end-1/4 animate-float"
          style={{ animationDelay: "-3s" }}
        />

        <motion.div variants={heroContainer} initial="hidden" animate="show" className="relative">
          <motion.p
            variants={heroItem}
            className="font-display uppercase tracking-[0.3em] text-accent-primary text-xs md:text-sm mb-4"
          >
            CS2 · Dota 2 · WoW · FACEIT
          </motion.p>
          <motion.h1
            variants={heroItem}
            className="font-display font-bold text-5xl md:text-7xl mb-4 tracking-tight"
          >
            {t("home.heroTitle")}
          </motion.h1>
          <motion.p variants={heroItem} className="text-text-secondary max-w-xl mx-auto mb-10 text-lg">
            {t("home.heroSubtitle")}
          </motion.p>
          <motion.div variants={heroItem}>
            <Link to="/shop/cs2">
              <Button className="text-base px-8 py-3">{t("home.browse")}</Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-2xl mb-5 tracking-wide">{t("home.featuredGames")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {games.map((game, i) => (
            <motion.div
              key={game.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                to={`/shop/${game.slug}`}
                className="monster-cut-sm group relative block bg-bg-surface border border-border-subtle p-6 text-center overflow-hidden hover:border-accent-primary/60 transition-all duration-200 hover:shadow-glow"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/0 to-accent-primary/0 group-hover:from-accent-primary/10 group-hover:to-transparent transition-all duration-300" />
                <p className="relative font-display font-semibold tracking-wide">{game.name}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-2xl mb-5 tracking-wide">{t("home.bestSellers")}</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : (
          <ProductGrid products={bestSellers} />
        )}
      </section>

      <section>
        <h2 className="font-display font-semibold text-2xl mb-5 tracking-wide">{t("home.whyUs")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {WHY_US.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-bg-surface border border-border-subtle rounded-card p-5 text-sm text-text-secondary hover:border-accent-secondary/50 transition-colors"
            >
              <span className="text-2xl mb-2 block">{item.icon}</span>
              {t(`home.whyUsItems.${item.key}`)}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
