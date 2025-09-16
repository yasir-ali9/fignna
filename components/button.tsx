"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", children, ...props },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-bk-30 text-fg-30 hover:bg-bk-20 hover:text-fg-10 focus:bg-bk-20 focus:text-fg-10",
      secondary:
        "bg-bk-50 text-fg-30 hover:bg-bk-40 hover:text-fg-10 focus:bg-bk-40 focus:text-fg-10",
      ghost:
        "text-fg-60 hover:text-fg-30 hover:bg-bk-40 focus:text-fg-30 focus:bg-bk-40",
      outline:
        "border border-bd-50 text-fg-30 hover:bg-bk-40 hover:text-fg-10 focus:bg-bk-40 focus:text-fg-10",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded-md",
      md: "px-4 py-2 text-sm rounded-md",
      lg: "px-6 py-3 text-base rounded-lg",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
