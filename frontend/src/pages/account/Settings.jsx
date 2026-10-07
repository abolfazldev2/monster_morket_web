import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { useLocale } from "../../context/LocaleContext";
import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { steamApi } from "../../services/resources";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fa", label: "فارسی" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
];

export default function Settings() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connection, setConnection] = useState(null);
  const [tradeUrl, setTradeUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    steamApi.connection().then(({ data }) => {
      setConnection(data);
      setTradeUrl(data.trade_url || "");
    });
    const result = searchParams.get("steam");
    if (result) {
      setNotice(t(`steam.result.${result}`, t("steam.result.failed")));
      setSearchParams({}, { replace: true });
    }
  }, []);

  const connect = async () => {
    setBusy(true);
    try {
      const { data } = await steamApi.beginConnect();
      window.location.assign(data.url);
    } catch (err) {
      setNotice(err.response?.data?.detail || t("steam.result.failed"));
      setBusy(false);
    }
  };

  const saveTradeUrl = async () => {
    setBusy(true);
    try {
      const { data } = await steamApi.saveTradeUrl(tradeUrl);
      setConnection(data);
      setTradeUrl(data.trade_url || "");
      setNotice(t("steam.saved"));
    } catch {
      setNotice(t("steam.invalidTradeUrl"));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await steamApi.disconnect();
      setConnection({ steam_id64: null, trade_url: "" });
      setTradeUrl("");
      setNotice(t("steam.disconnected"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t("account.settings")}</h1>
      <label className="block mb-2 text-sm text-text-secondary">{t("common.language")}</label>
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
      <section className="mt-8 rounded-xl border border-border-subtle bg-bg-surface p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t("steam.title")}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t("steam.description")}</p>
        </div>
        {notice && <p role="status" className="text-sm text-accent-secondary">{notice}</p>}
        {connection?.steam_id64 ? (
          <>
            <p className="text-sm">{t("steam.connectedAs")}: <span dir="ltr">{connection.steam_id64}</span></p>
            <Link className="text-accent-primary underline text-sm" to="/account/inventory">{t("steam.openInventory")}</Link>
            <div className="flex flex-col gap-3">
              <Input label={t("steam.tradeUrl")} value={tradeUrl} onChange={(e) => setTradeUrl(e.target.value)} placeholder="https://steamcommunity.com/tradeoffer/new/?partner=...&token=..." />
              <div className="flex gap-3 flex-wrap">
                <Button onClick={saveTradeUrl} disabled={busy}>{t("common.saveChanges")}</Button>
                <button type="button" onClick={disconnect} disabled={busy} className="text-sm text-accent-danger">{t("steam.disconnect")}</button>
              </div>
            </div>
          </>
        ) : (
          <Button onClick={connect} disabled={busy}>{t("steam.connect")}</Button>
        )}
        <p className="text-xs text-text-secondary">{t("steam.securityNote")}</p>
      </section>
    </div>
  );
}
