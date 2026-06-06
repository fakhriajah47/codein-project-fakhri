import React from "react";

export type BrutalCardVariant = "default" | "highlight" | "warning" | "danger" | "success" | "ai" | "flat";

interface BrutalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BrutalCardVariant;
  interactive?: boolean;
  children: React.ReactNode;
}

export const BrutalCard: React.FC<BrutalCardProps> = ({
  variant = "default",
  interactive = false,
  children,
  className = "",
  ...props
}) => {
  const baseClass = "rounded-2xl border-2 border-brutal-black p-5 transition-all";
  
  const variantClasses: Record<BrutalCardVariant, string> = {
    default: "bg-white text-brutal-black",
    highlight: "bg-brutal-yellow text-brutal-black",
    warning: "bg-brutal-orange text-brutal-black",
    danger: "bg-brutal-coral text-brutal-black",
    success: "bg-brutal-mint text-brutal-black",
    ai: "bg-brutal-purple text-brutal-black",
    flat: "bg-brutal-soft-bg text-brutal-black"
  };

  const shadowClass = variant === "flat" ? "" : "shadow-brutal-md";
  const hoverClass = interactive && variant !== "flat"
    ? "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm cursor-pointer"
    : "";

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${shadowClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
