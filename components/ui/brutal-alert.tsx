import React from "react";

export type BrutalAlertVariant = "info" | "success" | "warning" | "danger" | "ai";

interface BrutalAlertProps {
  variant?: BrutalAlertVariant;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const BrutalAlert: React.FC<BrutalAlertProps> = ({
  variant = "info",
  title,
  description,
  action,
  className = "",
  children
}) => {
  const variantClasses: Record<BrutalAlertVariant, string> = {
    info: "bg-brutal-blue text-white",
    success: "bg-brutal-mint text-brutal-black",
    warning: "bg-brutal-yellow text-brutal-black",
    danger: "bg-brutal-coral text-white",
    ai: "bg-brutal-purple text-brutal-black"
  };

  return (
    <div
      className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border-2 border-brutal-black rounded-xl shadow-brutal-sm ${variantClasses[variant]} ${className}`}
    >
      <div className="flex flex-col gap-1">
        {title && <h5 className="font-bold text-base leading-tight font-space">{title}</h5>}
        {description && <p className="text-sm font-medium opacity-90 leading-normal">{description}</p>}
        {children && <div className="text-sm font-medium opacity-90 leading-normal">{children}</div>}
      </div>
      {action && <div className="flex-shrink-0 self-end md:self-center">{action}</div>}
    </div>
  );
};
