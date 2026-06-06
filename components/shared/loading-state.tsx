import React from "react";
import { BrutalCard } from "../ui/brutal-card";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading your project command center...",
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-center p-12 w-full ${className}`}>
      <BrutalCard variant="default" className="flex flex-col items-center justify-center p-8 max-w-sm text-center">
        <Loader2 size={36} className="animate-spin text-brutal-blue mb-4" />
        <p className="font-bold text-base text-brutal-black font-space">{message}</p>
      </BrutalCard>
    </div>
  );
};
