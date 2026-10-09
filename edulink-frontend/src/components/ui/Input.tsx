import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, rightElement, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-main">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all bg-surface
              focus:ring-2 focus:ring-primary focus:border-transparent text-text-main placeholder:text-text-muted/50
              ${error ? 'border-error focus:ring-error' : 'border-border'}
              ${rightElement ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center text-text-muted">
              {rightElement}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-error mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
