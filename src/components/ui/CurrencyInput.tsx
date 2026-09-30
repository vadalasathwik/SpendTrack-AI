import React, { forwardRef } from 'react';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currencySymbol?: string;
  error?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, currencySymbol = '₹', className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400 pointer-events-none select-none">
            {currencySymbol}
          </span>
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            value={value}
            onChange={onChange}
            className={`
              w-full rounded-xl
              bg-slate-900
              border border-slate-700
              text-slate-100
              placeholder:text-slate-400
              caret-emerald-400
              text-left
              tabular-nums
              pl-9 pr-4 py-3
              font-bold text-base
              focus:outline-none
              focus:ring-2
              focus:ring-emerald-500/20
              focus:border-emerald-400
              transition-all
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

CurrencyInput.displayName = 'CurrencyInput';
