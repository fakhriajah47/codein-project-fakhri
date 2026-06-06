import React from "react";

export type BrutalButtonVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "ghost" | "ai";
export type BrutalButtonSize = "sm" | "md" | "lg" | "icon";

interface BrutalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BrutalButtonVariant;
  size?: BrutalButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const BrutalButton: React.FC<BrutalButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseClass = "inline-flex items-center justify-center font-bold border-2 border-brutal-black rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-brutal-blue/20 disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses: Record<BrutalButtonVariant, string> = {
    primary: "bg-brutal-blue text-white shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm",
    secondary: "bg-white text-brutal-black shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm",
    success: "bg-brutal-mint text-brutal-black shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm",
    warning: "bg-brutal-yellow text-brutal-black shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm",
    danger: "bg-brutal-coral text-white shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm",
    ghost: "border-transparent text-brutal-black hover:bg-brutal-soft-bg active:bg-brutal-soft-bg/80 shadow-none",
    ai: "bg-brutal-purple text-brutal-black shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm"
  };

  const sizeClasses: Record<BrutalButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3.5 text-lg",
    icon: "p-2.5 w-10 h-10"
  };

  return (
    <button
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
    </button>
  );
};
