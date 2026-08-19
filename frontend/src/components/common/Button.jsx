import { motion } from "framer-motion";
import React from "react";

const VARIANTS = {
  primary:
    "bg-accent-primary text-white hover:bg-accent-primaryHover hover:shadow-glow font-display font-semibold tracking-wide",
  secondary:
    "bg-transparent border border-border-subtle text-text-primary hover:border-accent-primary/60 hover:text-accent-primary",
  danger: "bg-accent-danger text-white hover:opacity-90",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary",
};

export default function Button({ variant = "primary", className = "", children, disabled, ...props }) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
