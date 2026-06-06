import React from "react";

export type BrutalBadgeVariant = "default" | "blue" | "yellow" | "green" | "red" | "purple" | "orange" | "gray";

interface BrutalBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BrutalBadgeVariant;
  children: React.ReactNode;
}

export const BrutalBadge: React.FC<BrutalBadgeProps> = ({
  variant = "default",
  children,
  className = "",
  ...props
}) => {
  const baseClass = "inline-flex items-center rounded-full border-2 border-brutal-black px-3 py-0.5 text-xs font-black uppercase tracking-wide shadow-brutal-sm";

  const variantClasses: Record<BrutalBadgeVariant, string> = {
    default: "bg-white text-brutal-black",
    blue: "bg-brutal-blue text-white",
    yellow: "bg-brutal-yellow text-brutal-black",
    green: "bg-brutal-mint text-brutal-black",
    red: "bg-brutal-coral text-white",
    purple: "bg-brutal-purple text-brutal-black",
    orange: "bg-brutal-orange text-brutal-black",
    gray: "bg-brutal-soft-bg text-brutal-black"
  };

  return (
    <span
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
