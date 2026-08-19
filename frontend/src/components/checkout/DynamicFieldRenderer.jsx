import React from "react";

import { Input, Select } from "../common/Input";

/**
 * Renders whatever `required_fields` the product returns from the API —
 * no product-specific checkout components exist anywhere in this app.
 * Adding a new required field to a product on the backend (e.g. a new
 * "region" select for a future game) needs zero frontend changes.
 */
export default function DynamicFieldRenderer({ fields, values, onChange, errors = {} }) {
  if (!fields?.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => {
        const commonProps = {
          key: field.field_key,
          label: field.label + (field.is_required ? " *" : ""),
          value: values[field.field_key] || "",
          onChange: (e) => onChange(field.field_key, e.target.value),
          required: field.is_required,
          error: errors[field.field_key],
        };

        if (field.field_type === "select") {
          return <Select {...commonProps} options={field.options || []} />;
        }
        return (
          <Input
            {...commonProps}
            type={field.field_type === "url" ? "url" : "text"}
            placeholder={field.label}
          />
        );
      })}
    </div>
  );
}
