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
            <li>{t("home.whyUsItems.secure")}</li>
            <li>{t("home.whyUsItems.fast")}</li>
            <li>{t("home.whyUsItems.trusted")}</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-text-primary mb-2">{t("common.support")}</p>
          <p>{t("common.telegramSupport")}</p>
        </div>
      </div>
    </footer>
  );
}
