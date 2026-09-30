import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await api.patch("/users/me/", form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">{t("account.profile")}</h1>
      <div className="flex flex-col gap-4">
        <Input label={t("common.username")} value={user?.username || ""} disabled />
        <Input
          label={t("common.firstName")}
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <Input
          label={t("common.lastName")}
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
        <Input
          label={t("common.email")}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Button onClick={handleSave}>{saved ? t("common.saved") : t("common.saveChanges")}</Button>
      </div>
    </div>
  );
}
