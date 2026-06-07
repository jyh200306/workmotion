'use client';

import { ButtonHTMLAttributes } from 'react';

interface SeniorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'lg';
}

const variantClass = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const sizeClass = {
  md: 'min-h-[60px] min-w-[60px] px-6 py-3 text-2xl',
  lg: 'min-h-[72px] min-w-[72px] px-8 py-4 text-3xl',
};

export function SeniorButton({
  variant = 'primary',
  size = 'lg',
  className = '',
  children,
  ...props
}: SeniorButtonProps) {
  return (
    <button
      className={`
        ${variantClass[variant]} ${sizeClass[size]}
        font-bold rounded-2xl
        active:scale-95 transition-transform duration-100
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
