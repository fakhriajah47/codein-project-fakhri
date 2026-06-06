import React from "react";

interface BrutalTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const BrutalTextarea: React.FC<BrutalTextareaProps> = ({
  label,
  error,
  helperText,
  className = "",
  id,
  rows = 4,
  ...props
}) => {
  const generatedId = React.useId();
  const textareaId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={textareaId} className="font-bold text-sm text-brutal-black font-space">
          {label}
        </label>
      )}
      
      <textarea
        id={textareaId}
        rows={rows}
        className={`bg-white border-2 border-brutal-black rounded-xl px-4 py-3 w-full font-medium text-brutal-black focus:outline-none focus:ring-4 focus:ring-brutal-blue/20 transition-all ${
          error ? "border-brutal-coral focus:ring-brutal-coral/20" : ""
        } ${className}`}
        {...props}
      />

      {error && (
        <p className="text-brutal-coral text-xs font-bold mt-0.5">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-brutal-charcoal/70 text-xs mt-0.5">{helperText}</p>
      )}
    </div>
  );
};
