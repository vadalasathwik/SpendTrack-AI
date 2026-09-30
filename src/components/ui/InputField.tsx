import React, { forwardRef } from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className = '', error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-xl
              bg-slate-900
              border border-slate-700
              text-slate-100
              placeholder:text-slate-400
              caret-emerald-400
              px-4 py-3
              font-bold text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-emerald-500/20
              focus:border-emerald-400
              transition-all
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-rose-400 mt-1 font-medium">{error}</p>}
      </div>
    );
  }
);

InputField.displayName = 'InputField';
