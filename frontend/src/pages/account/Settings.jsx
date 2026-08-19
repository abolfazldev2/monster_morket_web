import React from "react";

import { useLocale } from "../../context/LocaleContext";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fa", label: "فارسی" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
];

export default function Settings() {
  const { language, setLanguage } = useLocale();

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <label className="block mb-2 text-sm text-text-secondary">Language</label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
