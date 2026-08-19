import React from "react";
import { useTranslation } from "react-i18next";
import { Navigate, NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fa", label: "فارسی" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
];

export default function AdminLayout() {
  const { user, isLoading, isAdmin } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage } = useLocale();

  if (isLoading) return null;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  const links = [
    { to: "/admin", label: t("admin.nav.overview"), end: true },
    { to: "/admin/orders", label: t("admin.nav.orders") },
    { to: "/admin/fulfillment", label: t("admin.nav.fulfillment") },
    { to: "/admin/products", label: t("admin.nav.products") },
    { to: "/admin/games", label: t("admin.nav.games") },
    { to: "/admin/coupons", label: t("admin.nav.coupons") },
    { to: "/admin/reviews", label: t("admin.nav.reviews") },
  ];

  const superAdminLinks = [
    { to: "/admin/users", label: t("admin.nav.users") },
    { to: "/admin/audit-logs", label: t("admin.nav.auditLogs") },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-bg-surface border-e border-border-subtle p-4 flex flex-col gap-1">
        <p className="font-bold mb-2">
          MONSTER <span className="text-accent-primary">Admin</span>
        </p>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-bg-surfaceAlt text-sm text-text-secondary border border-border-subtle rounded-lg px-2 py-1 mb-4"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>

        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm ${
                isActive ? "bg-bg-surfaceAlt text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
        {user.role === "SUPER_ADMIN" &&
          superAdminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm ${
                  isActive ? "bg-bg-surfaceAlt text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
