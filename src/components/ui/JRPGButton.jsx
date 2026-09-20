import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function JRPGButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-wide transition-all duration-150 rounded-lg select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const variantStyles = {
    primary: "bg-amber-700 hover:bg-amber-600 text-white shadow-sm border border-amber-800/40 hover:shadow-md",
    secondary: "bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] border border-[#d6c7ab] shadow-sm",
    danger: "bg-red-700 hover:bg-red-600 text-white shadow-sm border border-red-800/40",
    cyan: "bg-blue-700 hover:bg-blue-600 text-white shadow-sm border border-blue-800/40",
    ghost: "bg-transparent hover:bg-[#f4ebd9] text-[#6b5a4b] hover:text-[#2c221e]",
    outline: "bg-[#fffdf9] hover:bg-[#f4ebd9] text-amber-800 border border-[#d6c7ab] hover:border-amber-700 shadow-sm"
  };

  const sizeStyles = {
    xs: "text-xs px-2.5 py-1 gap-1.5",
    sm: "text-xs px-3 py-1.5 gap-2",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}
