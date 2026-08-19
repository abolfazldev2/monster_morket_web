import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import ar from "./locales/ar/translation.json";
import en from "./locales/en/translation.json";
import fa from "./locales/fa/translation.json";
import ru from "./locales/ru/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fa: { translation: fa },
      ar: { translation: ar },
      ru: { translation: ru },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export const RTL_LANGUAGES = new Set(["fa", "ar"]);

export default i18n;
