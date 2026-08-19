import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLocale } from "../../context/LocaleContext";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fa", label: "فارسی" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
];

function NavItem({ to, label, active }) {
  return (
    <Link to={to} className="relative py-1 text-text-secondary hover:text-text-primary transition-colors">
      {label}
      {active && (
        <motion.span
          layoutId="nav-underline"
          className="absolute -bottom-1 start-0 end-0 h-0.5 bg-accent-primary rounded-full"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}

export default function Navbar() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLocale();
  const { itemCount } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    setSearchOpen(false);
    setSearchValue("");
  };

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/shop/cs2", label: t("nav.cs2") },
    { to: "/shop/dota2", label: t("nav.dota2") },
    { to: "/shop/wow", label: t("nav.wow") },
    { to: "/shop/faceit", label: t("nav.faceit") },
    { to: "/offers", label: t("nav.offers") },
    { to: "/best-sellers", label: t("nav.bestSellers") },
  ];

  return (
    <header
      className={`sticky top-0 z-40 bg-bg-base/90 backdrop-blur border-b transition-shadow duration-300 ${
        scrolled ? "border-border-subtle shadow-[0_4px_24px_rgba(0,0,0,0.4)]" : "border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="font-display font-bold text-xl tracking-tight group">
          MONSTER{" "}
          <span className="text-accent-primary group-hover:drop-shadow-[0_0_8px_rgba(226,59,59,0.8)] transition-all">
            Market
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <NavItem key={link.to} {...link} active={location.pathname === link.to} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={t("nav.search")}
            className="text-text-secondary hover:text-accent-primary transition-colors"
          >
            🔍
          </button>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="hidden md:block bg-transparent text-sm text-text-secondary border border-border-subtle rounded-lg px-2 py-1"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          <Link
            to="/account/wishlist"
            aria-label={t("common.wishlist")}
            className="text-text-secondary hover:text-accent-primary transition-colors"
          >
            ♥
          </Link>

          <Link to="/cart" className="relative text-text-secondary hover:text-accent-primary transition-colors">
            🛒
            {itemCount > 0 && (
              <motion.span
                key={itemCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -inline-end-2 bg-accent-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center"
              >
                {itemCount}
              </motion.span>
            )}
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin" className="text-sm text-accent-primary hover:text-accent-primaryHover">
                  Admin
                </Link>
              )}
              <Link to="/account" className="text-sm text-text-secondary hover:text-text-primary">
                {user.username}
              </Link>
              <button onClick={logout} className="text-sm text-text-muted hover:text-text-primary">
                {t("common.logout")}
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:block text-sm text-text-secondary hover:text-text-primary">
              {t("common.login")}
            </Link>
          )}

          <button
            className="lg:hidden text-text-secondary"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>

      {searchOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border-subtle px-4 py-3"
        >
          <form onSubmit={handleSearchSubmit} className="max-w-7xl mx-auto flex gap-2">
            <input
              autoFocus
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("nav.search")}
              className="flex-1 bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-primary"
            />
            <button type="submit" className="bg-accent-primary text-white px-4 py-2 rounded-lg text-sm">
              {t("nav.search")}
            </button>
          </form>
        </motion.div>
      )}

      {mobileOpen && (
        <div className="lg:hidden border-t border-border-subtle px-4 py-3 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="text-text-secondary">
              {link.label}
            </Link>
          ))}
          {!user && (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="text-text-secondary">
              {t("common.login")}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
