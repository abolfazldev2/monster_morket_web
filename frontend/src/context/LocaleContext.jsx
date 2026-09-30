import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { RTL_LANGUAGES } from "../i18n";

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(
    localStorage.getItem("mm_language") || i18n.language || "en"
  );

  const dir = RTL_LANGUAGES.has(language) ? "rtl" : "ltr";

  useEffect(() => {
    if (i18n.resolvedLanguage !== language) i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [i18n, language, dir]);

  const setLanguage = (lang) => {
    localStorage.setItem("mm_language", lang);
    i18n.changeLanguage(lang);
    setLanguageState(lang);
  };

  return (
    <LocaleContext.Provider value={{ language, dir, setLanguage }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
