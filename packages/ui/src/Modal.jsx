import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-4xl',
  hideCloseButton = false,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-gray-900/40">
      {/* Click-away backdrop */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className={`relative w-full ${maxWidth} bg-white rounded-2xl border border-gray-100 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex justify-between items-start shrink-0">
            <div>
              {title && <h2 className="text-xl font-bold text-primary">{title}</h2>}
              {subtitle && <p className="text-xs text-primary/70 mt-0.5">{subtitle}</p>}
            </div>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};