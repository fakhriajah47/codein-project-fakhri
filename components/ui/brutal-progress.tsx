import React from "react";

export type BrutalProgressVariant = "default" | "success" | "warning" | "danger";

interface BrutalProgressProps {
  value: number;
  label?: string;
  showValue?: boolean;
  variant?: BrutalProgressVariant;
  className?: string;
}

export const BrutalProgress: React.FC<BrutalProgressProps> = ({
  value,
  label,
  showValue = false,
  variant,
  className = ""
}) => {
  const percentage = Math.max(0, Math.min(100, value));

  // Determine variant based on value if not specified
  const computedVariant = variant || (
    percentage < 40 ? "danger" : 
    percentage < 80 ? "warning" : 
    percentage < 100 ? "default" : "success"
  );

  const barColors: Record<BrutalProgressVariant, string> = {
    default: "bg-brutal-blue",
    success: "bg-brutal-mint",
    warning: "bg-brutal-yellow",
    danger: "bg-brutal-coral"
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs font-bold text-brutal-black font-space">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      
      <div className="h-5 w-full bg-white border-2 border-brutal-black rounded-full overflow-hidden shadow-brutal-sm">
        <div
          className={`h-full border-r-2 border-brutal-black ${barColors[computedVariant]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
