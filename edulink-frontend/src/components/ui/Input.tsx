import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-main">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`border rounded-lg px-3 py-2 text-sm outline-none transition-all bg-surface
            focus:ring-2 focus:ring-primary focus:border-transparent text-text-main placeholder:text-text-muted/50
            ${error ? 'border-error focus:ring-error' : 'border-border'}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-xs text-error mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
