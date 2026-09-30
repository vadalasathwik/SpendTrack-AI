import React from 'react';

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  required,
  className = '',
  ...props
}) => {
  return (
    <label
      className={`block text-xs font-bold text-slate-300 dark:text-slate-300 mb-1.5 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-rose-400 ml-1">*</span>}
    </label>
  );
};
