import React from "react";

interface BrutalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const BrutalInput: React.FC<BrutalInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  className = "",
  id,
  ...props
}) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="font-bold text-sm text-brutal-black font-space">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-4 text-brutal-charcoal pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={`bg-white border-2 border-brutal-black rounded-xl px-4 py-3 w-full font-medium text-brutal-black focus:outline-none focus:ring-4 focus:ring-brutal-blue/20 transition-all ${
            leftIcon ? "pl-11" : ""
          } ${error ? "border-brutal-coral focus:ring-brutal-coral/20" : ""} ${className}`}
          {...props}
        />
      </div>

      {error && (
        <p className="text-brutal-coral text-xs font-bold mt-0.5">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-brutal-charcoal/70 text-xs mt-0.5">{helperText}</p>
      )}
    </div>
  );
};
