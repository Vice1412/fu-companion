import React, { useEffect } from 'react';
import { GiCrossMark } from 'react-icons/gi';

export default function JRPGModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-xl',
  actionButtons = null
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className={`relative w-full ${maxWidth} bg-[#fffdf9] border-2 border-[#d6c7ab] rounded-xl shadow-2xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh] text-[#2c221e]`}>
        {/* Top gold accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#d6c7ab] flex items-center justify-between bg-[#f4ebd9] shrink-0">
          <h3 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
            <span className="text-amber-700">❖</span>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6b5a4b] hover:text-[#2c221e] p-1.5 rounded-lg hover:bg-[#e4d9c0] transition-colors"
          >
            <GiCrossMark className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Action Footer */}
        {actionButtons && (
          <div className="px-5 py-3 border-t border-[#d6c7ab] bg-[#f8f3e8] flex items-center justify-end gap-3 shrink-0">
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );
}
