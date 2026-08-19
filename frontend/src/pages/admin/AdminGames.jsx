import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Skeleton } from "../../components/common/Feedback";
import { adminCategoriesApi, adminGamesApi } from "../../services/resources";
import { unwrapList } from "../../utils/unwrapList";

export default function AdminGames() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newGame, setNewGame] = useState({ name: "", slug: "" });
  const [newCategory, setNewCategory] = useState({});

  const { data: gamesRaw, isLoading } = useQuery({
    queryKey: ["admin", "games"],
    queryFn: () => adminGamesApi.list().then((r) => r.data),
  });
  const games = unwrapList(gamesRaw);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "games"] });

  const handleCreateGame = async () => {
    if (!newGame.name || !newGame.slug) return;
    await adminGamesApi.create(newGame);
    setNewGame({ name: "", slug: "" });
    invalidate();
  };

  const handleCreateCategory = async (gameId) => {
    const draft = newCategory[gameId];
    if (!draft?.name || !draft?.slug) return;
    await adminCategoriesApi.create({ game: gameId, name: draft.name, slug: draft.slug });
    setNewCategory({ ...newCategory, [gameId]: { name: "", slug: "" } });
    invalidate();
  };

  const handleDeleteCategory = async (id) => {
    await adminCategoriesApi.remove(id);
    invalidate();
  };

  const handleToggleActive = async (game) => {
    await adminGamesApi.update(game.id, { is_active: !game.is_active });
    invalidate();
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("admin.games.title")}</h1>

      <div className="bg-bg-surface border border-border-subtle rounded-card p-4 mb-6 flex gap-3 items-end">
        <Input
          label={t("admin.games.newGameName")}
          value={newGame.name}
          onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
        />
        <Input
          label={t("admin.games.slug")}
          value={newGame.slug}
          onChange={(e) => setNewGame({ ...newGame, slug: e.target.value })}
        />
        <Button onClick={handleCreateGame}>{t("admin.games.addGame")}</Button>
      </div>

      <div className="flex flex-col gap-4">
        {games.map((game) => (
          <div key={game.id} className="bg-bg-surface border border-border-subtle rounded-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium">{game.name}</p>
              <button onClick={() => handleToggleActive(game)} className="text-xs text-text-secondary hover:text-text-primary">
                {game.is_active ? t("admin.games.deactivate") : t("admin.games.activate")}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {game.categories?.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-2 bg-bg-surfaceAlt border border-border-subtle rounded-full px-3 py-1 text-xs"
                >
                  {cat.name}
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-text-muted hover:text-accent-danger">
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                placeholder={t("admin.games.categoryName")}
                value={newCategory[game.id]?.name || ""}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, [game.id]: { ...newCategory[game.id], name: e.target.value } })
                }
                className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-1.5 text-xs"
              />
              <input
                placeholder={t("admin.games.slug")}
                value={newCategory[game.id]?.slug || ""}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, [game.id]: { ...newCategory[game.id], slug: e.target.value } })
                }
                className="bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-1.5 text-xs"
              />
              <button
                onClick={() => handleCreateCategory(game.id)}
                className="text-xs text-accent-primary hover:text-accent-primaryHover"
              >
                {t("admin.games.addCategory")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
