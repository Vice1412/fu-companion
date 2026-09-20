import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function JRPGCard({
  children,
  className = '',
  crisis = false,
  highlight = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          "bg-[#fffdf9] rounded-xl border border-[#d6c7ab] shadow-sm transition-all duration-200 overflow-hidden relative text-[#2c221e]",
          highlight && "border-amber-600 shadow-amber-900/10 shadow-md",
          crisis && "crisis-pulse-active border-red-500 bg-red-50/40",
          onClick && "cursor-pointer hover:border-amber-600 hover:shadow-md",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function JRPGCardHeader({ children, className = '', action = null }) {
  return (
    <div className={twMerge(clsx("px-4 sm:px-5 py-3 border-b border-[#d6c7ab] flex items-center justify-between bg-[#f4ebd9]", className))}>
      <div className="flex items-center gap-2.5 min-w-0 font-bold text-[#3c2415]">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function JRPGCardBody({ children, className = '' }) {
  return (
    <div className={twMerge(clsx("p-4 sm:p-5", className))}>
      {children}
    </div>
  );
}

export function JRPGCardFooter({ children, className = '' }) {
  return (
    <div className={twMerge(clsx("px-4 sm:px-5 py-2.5 border-t border-[#d6c7ab] bg-[#f8f3e8] flex items-center justify-between", className))}>
      {children}
    </div>
  );
}
