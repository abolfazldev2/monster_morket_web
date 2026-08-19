import React, { useState } from "react";

import Button from "../components/common/Button";
import { Input } from "../components/common/Input";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users/password-reset/", { email });
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-16">
      <h1 className="text-2xl font-bold mb-6 text-center">Forgot password</h1>
      {sent ? (
        <p className="text-text-secondary text-center">
          If an account exists for that email, we've sent password reset instructions.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" disabled={loading} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </div>
  );
}
