'use client';

import { ButtonHTMLAttributes } from 'react';

interface SeniorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'lg';
}

const variantClass = {
  primary: 'bg-[#d8ff36] text-[#14181d] active:bg-[#b8df16]',
  secondary: 'bg-[#2a3139] text-[#f0f0f0] active:bg-[#343c45]',
  danger: 'bg-[#e05260] text-white active:bg-[#c8404d]',
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
