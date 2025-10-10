"use client";
import { ReactNode } from "react";

// Interface for badge component props
interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "accent";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

// Reusable badge component with minimal design
export default function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  // Base styles for all badges
  const baseStyles =
    "inline-flex items-center justify-center font-normal rounded-full transition-all duration-200";

  // Size variants
  const sizeStyles = {
    xs: "px-1 py-[1px] text-[8px]",
    sm: "px-2 py-0.5 text-[9px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  // Variant styles - minimal with borders only
  const variantStyles = {
    default: "text-fg-70 border border-bd-50",
    accent:
      "text-ac-01 border border-transparent [background:linear-gradient(rgb(var(--bk-70)),rgb(var(--bk-70)))_padding-box,linear-gradient(to_right,rgb(var(--ac-01)),rgb(var(--bk-70)))_border-box]",
  };

  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  return <span className={combinedClassName}>{children}</span>;
}
