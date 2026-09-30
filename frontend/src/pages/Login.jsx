import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.username, form.password);
      navigate("/account");
    } catch {
        setError(t("common.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-16">
      <h1 className="text-2xl font-bold mb-6 text-center">{t("common.login")}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t("common.username")}
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <Input
          label={t("common.password")}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        {error && <p className="text-accent-danger text-sm">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {t("common.login")}
        </Button>
      </form>
      <div className="flex justify-between mt-4 text-sm text-text-secondary">
        <Link to="/forgot-password" className="hover:text-text-primary">
          {t("common.forgotPassword")}
        </Link>
        <Link to="/register" className="hover:text-text-primary">
          {t("common.register")}
        </Link>
      </div>
    </div>
  );
}
