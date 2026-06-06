import React from "react";
import { BrutalCard } from "../ui/brutal-card";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = ""
}) => {
  return (
    <BrutalCard variant="flat" className={`flex flex-col items-center justify-center text-center p-12 border-dashed border-2 ${className}`}>
      {icon && <div className="mb-4 text-brutal-charcoal/80 bg-brutal-soft-bg p-4 border-2 border-brutal-black rounded-full shadow-brutal-sm">{icon}</div>}
      <h3 className="text-xl font-bold text-brutal-black font-space mb-2">{title}</h3>
      <p className="text-sm font-medium text-brutal-charcoal/70 max-w-md mb-6">{description}</p>
      {action && <div>{action}</div>}
    </BrutalCard>
  );
};
