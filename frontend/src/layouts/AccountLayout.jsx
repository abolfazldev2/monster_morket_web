import React from "react";
import { useTranslation } from "react-i18next";
import { Navigate, NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";

export default function AccountLayout() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const links = [
    { to: "/account", label: "Dashboard", end: true },
    { to: "/account/profile", label: "Profile" },
    { to: "/account/orders", label: "Orders" },
    { to: "/account/wishlist", label: t("common.wishlist") },
    { to: "/account/notifications", label: "Notifications" },
    { to: "/account/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        <aside className="flex md:flex-col gap-2 overflow-x-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                  isActive ? "bg-bg-surfaceAlt text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </aside>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
