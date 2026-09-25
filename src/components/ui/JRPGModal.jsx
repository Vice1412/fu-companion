import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

export default function JRPGModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-xl',
  actionButtons = null,
  theme = null
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Lock body scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      {/* Clickable Backdrop */}
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose} 
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${maxWidth} bg-[#fffdf9] border-2 border-[#d6c7ab] rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] text-[#2c221e]`}
        style={theme ? { backgroundColor: theme.cardBg || '#ffffff', borderColor: theme.border, color: theme.textDark } : {}}
      >
        {/* Top accent line */}
        <div
          className={`h-1 w-full ${theme?.gradient ? `bg-gradient-to-r ${theme.gradient}` : 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700'}`}
        />

        {/* Modal Header */}
        <div
          className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-[#d6c7ab] flex items-center justify-between bg-[#f4ebd9] shrink-0"
          style={theme ? { backgroundColor: theme.headerBg, borderColor: theme.border } : {}}
        >
          <h3
            className="font-serif font-black text-base sm:text-lg text-[#3c2415] flex items-center gap-2 truncate"
            style={theme ? { color: theme.textDark } : {}}
          >
            <span style={theme ? { color: theme.accent } : { color: '#b45309' }}>❖</span>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6b5a4b] hover:text-[#2c221e] p-1.5 rounded-lg hover:bg-[#e4d9c0] transition-colors shrink-0"
            style={theme ? { color: theme.textMuted } : {}}
            title="關閉視窗"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-2.5 sm:p-5 overflow-y-auto flex-1 flex flex-col min-h-0">
          {children}
        </div>

        {/* Action Footer */}
        {actionButtons && (
          <div
            className="px-5 py-3 border-t border-[#d6c7ab] bg-[#f8f3e8] flex items-center justify-end gap-3 shrink-0"
            style={theme ? { backgroundColor: theme.subpanelBg, borderColor: theme.border } : {}}
          >
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
