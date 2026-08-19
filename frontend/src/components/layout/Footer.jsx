import React from "react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border-subtle mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-text-secondary">
        <div>
          <p className="font-bold text-text-primary mb-2">
            MONSTER <span className="text-accent-primary">Market</span>
          </p>
          <p>{t("home.heroSubtitle")}</p>
        </div>
        <div>
          <p className="font-semibold text-text-primary mb-2">{t("home.whyUs")}</p>
          <ul className="space-y-1">
            <li>Secure ordering</li>
            <li>Fast fulfillment</li>
            <li>Trusted marketplace</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-text-primary mb-2">Support</p>
          <p>Telegram support available on every order.</p>
        </div>
      </div>
    </footer>
  );
}
