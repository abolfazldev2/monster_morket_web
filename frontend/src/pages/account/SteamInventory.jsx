import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import Button from "../../components/common/Button";
import { steamApi } from "../../services/resources";

export default function SteamInventory() {
  const { t } = useTranslation();
  const [game, setGame] = useState("cs2");
  const [connection, setConnection] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInventory = async (selectedGame = game) => {
    setLoading(true);
    setError("");
    try {
      const [{ data: linked }, { data }] = await Promise.all([
        steamApi.connection(),
        steamApi.inventory(selectedGame),
      ]);
      setConnection(linked);
      setInventory(data);
    } catch (err) {
      setConnection((current) => current || { steam_id64: null });
      setInventory(null);
      setError(err.response?.data?.detail || t("steam.inventoryUnavailable"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInventory(); }, []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("steam.inventoryTitle")}</h1>
          <p className="mt-2 text-sm text-text-secondary">{t("steam.inventoryDescription")}</p>
        </div>
        {connection?.steam_id64 && <Button onClick={() => loadInventory()} disabled={loading}>{t("steam.refresh")}</Button>}
      </div>
      {!connection?.steam_id64 && !loading ? (
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
          <p className="mb-4">{error || t("steam.connectFirst")}</p>
          <Link to="/account/settings" className="text-accent-primary underline">{t("steam.goToSettings")}</Link>
        </div>
      ) : (
        <>
          <label className="block mb-4 text-sm text-text-secondary">
            {t("steam.game")}
            <select value={game} onChange={(e) => { setGame(e.target.value); loadInventory(e.target.value); }} className="block mt-2 bg-bg-surface border border-border-subtle rounded-lg px-3 py-2">
              <option value="cs2">Counter-Strike 2</option>
              <option value="dota2">Dota 2</option>
            </select>
          </label>
          {error && <p role="alert" className="mb-4 text-accent-danger text-sm">{error}</p>}
          {loading ? <p>{t("steam.loading")}</p> : inventory?.items?.length ? (
            <>
              <p className="mb-4 text-sm text-text-secondary">{t("steam.itemCount", { count: inventory.total })}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {inventory.items.map((item) => (
                  <article key={item.asset_id} className="rounded-xl border border-border-subtle bg-bg-surface p-3 min-w-0">
                    {item.icon_url ? <img src={item.icon_url} alt="" loading="lazy" className="w-full h-28 object-contain" /> : <div className="h-28" />}
                    <h2 className="text-sm font-medium line-clamp-2 min-h-10">{item.name}</h2>
                    <p className="mt-2 text-xs text-text-secondary">{item.tradable ? t("steam.tradable") : t("steam.notTradable")}{item.amount > 1 ? ` · ×${item.amount}` : ""}</p>
                  </article>
                ))}
              </div>
            </>
          ) : !error && <p className="text-text-secondary">{t("steam.emptyInventory")}</p>}
        </>
      )}
      <p className="mt-6 text-xs text-text-secondary">{t("steam.tradeNotice")}</p>
    </div>
  );
}
