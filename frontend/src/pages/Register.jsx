import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate("/account");
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        // پیام‌های ارور بک‌اند را به شکل خوانا و تفکیک‌شده نمایش می‌دهیم
        const messages = Object.entries(data).map(([key, msgs]) => {
          const field = key === "non_field_errors" ? "" : `${key}: `;
          return `${field}${Array.isArray(msgs) ? msgs.join(" ") : msgs}`;
        });
        setError(messages.join(" | "));
      } else {
        setError("Could not register. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-sm mx-auto py-16">
      <h1 className="text-2xl font-bold mb-6 text-center">{t("common.register")}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        {error && <p className="text-accent-danger text-sm">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {t("common.register")}
        </Button>
      </form>
      <div className="text-center mt-4 text-sm text-text-secondary">
        <Link to="/login" className="hover:text-text-primary">
          {t("common.login")}
        </Link>
      </div>
    </div>
  );
}
