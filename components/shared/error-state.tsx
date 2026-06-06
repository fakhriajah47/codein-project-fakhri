import React from "react";
import { BrutalCard } from "../ui/brutal-card";
import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  description = "We couldn't load the requested data. Please try again.",
  action,
  className = ""
}) => {
  return (
    <BrutalCard variant="danger" className={`flex flex-col items-center justify-center text-center p-10 max-w-lg mx-auto ${className}`}>
      <div className="mb-4 text-white bg-brutal-coral p-3 border-2 border-brutal-black rounded-full shadow-brutal-sm">
        <AlertTriangle size={32} />
      </div>
      <h3 className="text-xl font-bold text-white font-space mb-2">{title}</h3>
      <p className="text-sm font-medium text-white/95 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </BrutalCard>
  );
};
