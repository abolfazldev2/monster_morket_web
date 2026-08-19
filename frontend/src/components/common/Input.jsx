import React from "react";

export function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-text-secondary mb-1">{label}</span>}
      <input
        className={`w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary ${className}`}
        {...props}
      />
      {error && <span className="block text-sm text-accent-danger mt-1">{error}</span>}
    </label>
  );
}

export function Select({ label, error, options = [], className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-text-secondary mb-1">{label}</span>}
      <select
        className={`w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-primary ${className}`}
        {...props}
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="block text-sm text-accent-danger mt-1">{error}</span>}
    </label>
  );
}
