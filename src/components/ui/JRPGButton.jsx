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
    emerald: "bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm border border-emerald-800/40 hover:shadow-md",
    purple: "bg-purple-700 hover:bg-purple-600 text-white shadow-sm border border-purple-800/40 hover:shadow-md",
    slate: "bg-slate-700 hover:bg-slate-600 text-white shadow-sm border border-slate-800/40 hover:shadow-md",
    secondary: "bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] border border-[#d6c7ab] shadow-sm",
    danger: "bg-red-700 hover:bg-red-600 text-white shadow-sm border border-red-800/40",
    cyan: "bg-blue-700 hover:bg-blue-600 text-white shadow-sm border border-blue-800/40",
    ghost: "bg-transparent hover:bg-black/5 text-slate-800 hover:text-slate-900",
    outline: "bg-[#fffdf9] hover:bg-[#f4ebd9] text-amber-800 border border-[#d6c7ab] hover:border-amber-700 shadow-sm",
    'outline-emerald': "bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 hover:border-emerald-600 shadow-sm",
    'outline-blue': "bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 hover:border-blue-600 shadow-sm",
    'outline-crimson': "bg-white hover:bg-red-50 text-red-900 border border-red-300 hover:border-red-600 shadow-sm",
    'outline-purple': "bg-white hover:bg-purple-50 text-purple-900 border border-purple-300 hover:border-purple-600 shadow-sm",
    'outline-slate': "bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 hover:border-slate-600 shadow-sm"
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
